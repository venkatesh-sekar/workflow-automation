/**
 * Inline worker — executes engine operations directly in the API process.
 * Replaces the upstream worker package by consuming BullMQ jobs and calling
 * the engine's piece helpers without forking a child process.
 */
import {
    EngineResponseStatus,
    ExecuteActionResponse,
    ExecuteToolResponse,
    ExecuteTriggerResponse,
    ExecuteValidateAuthResponse,
    TriggerHookType,
    WorkerJobType,
    isNil,
} from '@flow/shared'
import { DropdownState, DynamicPropsValue, PieceMetadata, PropertyType } from '@flow/pieces-framework'
import { pieceHelper } from '../../../../engine/src/lib/helper/piece-helper'
import { triggerHookOperation } from '../../../../engine/src/lib/operations/trigger-hook.operation'
import { QueueName, webhookSecretsUtils } from '@flow/server-common'
import { Worker, Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../database/redis-connections'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { flowVersionRepo } from '../flows/flow-version/flow-version.service'
import { pubsub } from './pubsub'

// Types re-exported from worker
export type EngineHelperFlowResult = Record<string, never>

export type EngineHelperTriggerResult<
    T extends TriggerHookType = TriggerHookType,
> = ExecuteTriggerResponse<T>

export type EngineHelperPropResult = {
    type: PropertyType.DROPDOWN
    options: DropdownState<unknown>
} | {
    type: PropertyType.DYNAMIC
    options: Record<string, DynamicPropsValue>
}

type OperationResult =
    | EngineHelperFlowResult
    | EngineHelperTriggerResult
    | EngineHelperPropResult
    | ExecuteToolResponse
    | ExecuteActionResponse
    | PieceMetadata
    | ExecuteValidateAuthResponse

export type OperationResponse<Result extends OperationResult> = {
    status: EngineResponseStatus
    result: Result
    standardError: string
    standardOutput: string
    delayInSeconds?: number
}

const INTERNAL_API_URL = 'http://127.0.0.1:3000/'
const PUBLIC_API_URL = 'http://127.0.0.1:3000/api/'

let worker: Worker | undefined

export const flowWorker = (log: FastifyBaseLogger) => ({
    async init(_opts: { workerToken: string, markAsHealthy: () => Promise<void> }): Promise<void> {
        const connection = await redisConnections.create()

        worker = new Worker(
            QueueName.WORKER_JOBS,
            async (job: Job) => {
                const jobData = job.data
                log.info({ jobType: jobData.jobType, requestId: jobData.requestId }, '[inlineWorker] Processing job')

                try {
                    switch (jobData.jobType) {
                        case WorkerJobType.EXECUTE_PROPERTY: {
                            const engineToken = await accessTokenManager(log).generateEngineToken({
                                jobId: jobData.requestId,
                                projectId: jobData.projectId,
                                platformId: jobData.platformId,
                            })

                            const result = await pieceHelper.executeProps({
                                pieceName: jobData.piece.pieceName,
                                pieceVersion: jobData.piece.pieceVersion,
                                propertyName: jobData.propertyName,
                                actionOrTriggerName: jobData.actionOrTriggerName,
                                input: jobData.input,
                                sampleData: jobData.sampleData ?? {},
                                flowVersion: jobData.flowVersion,
                                projectId: jobData.projectId,
                                platformId: jobData.platformId,
                                engineToken,
                                internalApiUrl: INTERNAL_API_URL,
                                publicApiUrl: PUBLIC_API_URL,
                                searchValue: jobData.searchValue,
                                timeoutInSeconds: 60,
                                piece: jobData.piece,
                            })

                            const response: OperationResponse<EngineHelperPropResult> = {
                                status: EngineResponseStatus.OK,
                                result,
                                standardError: '',
                                standardOutput: '',
                            }

                            await publishResponse(log, jobData.requestId, jobData.webserverId, response)
                            break
                        }
                        case WorkerJobType.EXECUTE_VALIDATE_AUTH: {
                            const engineToken = await accessTokenManager(log).generateEngineToken({
                                jobId: jobData.requestId,
                                projectId: jobData.projectId,
                                platformId: jobData.platformId,
                            })

                            const result = await pieceHelper.executeValidateAuth({
                                params: {
                                    ...jobData,
                                    engineToken,
                                    internalApiUrl: INTERNAL_API_URL,
                                    publicApiUrl: PUBLIC_API_URL,
                                    timeoutInSeconds: 60,
                                },
                            })

                            await publishResponse(log, jobData.requestId, jobData.webserverId, {
                                status: EngineResponseStatus.OK,
                                result,
                                standardError: '',
                                standardOutput: '',
                            })
                            break
                        }
                        case WorkerJobType.EXTRACT_PIECE_METADATA: {
                            const result = await pieceHelper.extractPieceMetadata({
                                params: {
                                    pieceName: jobData.piece.pieceName,
                                    pieceVersion: jobData.piece.pieceVersion,
                                    platformId: jobData.platformId,
                                    timeoutInSeconds: 60,
                                },
                            })

                            await publishResponse(log, jobData.requestId, jobData.webserverId, {
                                status: EngineResponseStatus.OK,
                                result,
                                standardError: '',
                                standardOutput: '',
                            })
                            break
                        }
                        case WorkerJobType.EXECUTE_TRIGGER_HOOK: {
                            const flowVersion = await flowVersionRepo().findOneBy({ id: jobData.flowVersionId })
                            if (isNil(flowVersion)) {
                                throw new Error(`Flow version not found: ${jobData.flowVersionId}`)
                            }

                            const engineToken = await accessTokenManager(log).generateEngineToken({
                                jobId: jobData.requestId,
                                projectId: jobData.projectId,
                                platformId: jobData.platformId,
                            })

                            const suffix = jobData.test ? '/test' : ''
                            const webhookUrl = `${PUBLIC_API_URL}v1/webhooks/${flowVersion.flowId}${suffix}`

                            const triggerPieceName = flowVersion.trigger?.settings?.pieceName
                            const appWebhookUrl = triggerPieceName
                                ? `${PUBLIC_API_URL}v1/app-events/${triggerPieceName}`
                                : undefined

                            const engineResponse = await triggerHookOperation.execute({
                                projectId: jobData.projectId,
                                platformId: jobData.platformId,
                                hookType: jobData.hookType,
                                test: jobData.test,
                                flowVersion,
                                webhookUrl,
                                triggerPayload: jobData.triggerPayload,
                                appWebhookUrl,
                                webhookSecret: await webhookSecretsUtils.getWebhookSecret(flowVersion),
                                engineToken,
                                internalApiUrl: INTERNAL_API_URL,
                                publicApiUrl: PUBLIC_API_URL,
                                timeoutInSeconds: 60,
                            })

                            const triggerResponse: OperationResponse<EngineHelperTriggerResult> = {
                                status: engineResponse.status,
                                result: engineResponse.response,
                                standardError: '',
                                standardOutput: '',
                            }

                            await publishResponse(log, jobData.requestId, jobData.webserverId, triggerResponse)
                            break
                        }
                        default:
                            log.warn({ jobType: jobData.jobType }, '[inlineWorker] Unhandled job type')
                    }
                }
                catch (error) {
                    log.error({ error, jobType: jobData.jobType }, '[inlineWorker] Job failed')
                    if (!isNil(jobData.requestId) && !isNil(jobData.webserverId)) {
                        await publishResponse(log, jobData.requestId, jobData.webserverId, {
                            status: EngineResponseStatus.INTERNAL_ERROR,
                            result: undefined as unknown as EngineHelperPropResult,
                            standardError: String(error),
                            standardOutput: '',
                        })
                    }
                }
            },
            {
                connection,
                concurrency: 10,
            },
        )

        worker.on('error', (err) => {
            log.error({ err }, '[inlineWorker] Worker error')
        })

        log.info('[inlineWorker] BullMQ worker started on queue: ' + QueueName.WORKER_JOBS)
        await _opts.markAsHealthy()
    },

    async close(): Promise<void> {
        if (worker) {
            await worker.close()
            worker = undefined
        }
    },
})

async function publishResponse(log: FastifyBaseLogger, requestId: string, webserverId: string, response: unknown): Promise<void> {
    const message = JSON.stringify({ requestId, response })
    await pubsub.publish(`engine-run:sync:${webserverId}`, message)
    log.info({ requestId }, '[inlineWorker] Response published')
}

export const packageManager = (_log: FastifyBaseLogger) => ({
    async validate(): Promise<void> { /* no-op */ },
})

export const registryPieceManager = (_log: FastifyBaseLogger) => ({
    async validate(): Promise<void> { /* no-op */ },
})
