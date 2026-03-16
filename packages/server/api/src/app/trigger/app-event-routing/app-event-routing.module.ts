import { pieceRegistry } from '@flow/piece-registry'
import { Piece, PieceAuthProperty } from '@flow/pieces-framework'
import {
    rejectedPromiseHandler,
    securityAccess,
} from '@flow/server-common'
import {
    FlowError,
    flowId,
    assertNotNullOrUndefined,
    ErrorCode,
    FlowStatus,
    isNil,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RunEnvironment,
    WorkerJobType,
} from '@flow/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { domainHelper } from '../../helper/domain-helper'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { WebhookFlowVersionToRun, webhookHandler } from '../../webhooks/webhook-handler'
import { jobQueue } from '../../workers/queue/job-queue'
import { JobType } from '../../workers/queue/queue-manager'
import { triggerSourceService } from '../trigger-source/trigger-source-service'
import { appEventRoutingService } from './app-event-routing.service'

const appWebhooks: Record<string, Piece<PieceAuthProperty | PieceAuthProperty[] | undefined>> = {
    slack: pieceRegistry.get('@flow/piece-slack') as Piece<PieceAuthProperty>,
}
const pieceNames: Record<string, string> = {
    slack: '@flow/piece-slack',
}

export const appEventRoutingModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(appEventRoutingController, { prefix: '/v1/app-events' })
}

export const appEventRoutingController: FastifyPluginAsyncZod = async (
    fastify,
) => {
    fastify.all(
        '/:pieceUrl',
        {
            config: {
                rawBody: true,
                security: securityAccess.public(),
            },
        },
        async (
            request: FastifyRequest<{
                Body: unknown
                Params: {
                    pieceUrl: string
                }
            }>,
            requestReply,
        ) => {
            const pieceUrl = request.params.pieceUrl
            const payload = {
                headers: request.headers as Record<string, string>,
                body: request.body,
                rawBody: request.rawBody,
                method: request.method,
                queryParams: request.query as Record<string, string>,
            }
            const piece = appWebhooks[pieceUrl]
            if (isNil(piece)) {
                throw new FlowError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityType: 'piece',
                        entityId: pieceUrl,
                        message: 'Piece is not found in app event routing',
                    },
                })
            }
            const appName = pieceNames[pieceUrl]
            assertNotNullOrUndefined(piece.events, 'Event is possible in this piece')
            const { reply, event, identifierValue } = piece.events.parseAndReply({
                payload,
                server: {
                    publicUrl: await domainHelper.getPublicUrl({ path: '' }),
                },
            })
            if (!isNil(reply)) {
                request.log.info(
                    {
                        reply,
                        piece: pieceUrl,
                    },
                    '[AppEventRoutingController#event] reply',
                )
                return requestReply
                    .status(StatusCodes.OK)
                    .headers(reply?.headers ?? {})
                    .send(reply?.body ?? {})
            }
            request.log.info(
                {
                    event,
                    identifierValue,
                },
                '[AppEventRoutingController#event] event',
            )
            if (isNil(event) || isNil(identifierValue)) {
                return requestReply.status(StatusCodes.BAD_REQUEST).send({})
            }
            const listeners = await appEventRoutingService.listListeners({
                appName,
                event,
                identifierValue,
            })
            const eventsQueue = listeners.map(async (listener) => {
                const requestId = flowId()
                const flow = await flowService(request.log).getOne({ id: listener.flowId, projectId: listener.projectId })
                if (isNil(flow)) {
                    return
                }
                const flowVersionIdToRun = await webhookHandler.getFlowVersionIdToRun(WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST, flow)
                const platformId = await projectService(request.log).getPlatformId(listener.projectId)
                return jobQueue(request.log).add({
                    id: requestId,
                    type: JobType.ONE_TIME,
                    data: {
                        platformId,
                        projectId: listener.projectId,
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        requestId,
                        payload,
                        flowId: listener.flowId,
                        jobType: WorkerJobType.EXECUTE_WEBHOOK,
                        runEnvironment: RunEnvironment.PRODUCTION,
                        saveSampleData: await triggerSourceService(request.log).existsByFlowId({
                            flowId: listener.flowId,
                            simulate: true,
                        }),
                        flowVersionIdToRun,
                        execute: flow.status === FlowStatus.ENABLED,
                    },
                })
            })
            rejectedPromiseHandler(Promise.all(eventsQueue), request.log)
            return requestReply.status(StatusCodes.OK).send({})
        },
    )
}
