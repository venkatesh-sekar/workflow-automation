/**
 * Inline worker — executes engine operations directly in the API process.
 * Replaces the upstream worker package by consuming BullMQ jobs and calling
 * the engine's piece helpers without forking a child process.
 */
import {
    EngineHttpResponse,
    EngineResponseStatus,
    EngineSocketEvent,
    ExecuteActionResponse,
    ExecuteFlowOperation,
    ExecuteToolResponse,
    ExecuteTriggerResponse,
    ExecuteValidateAuthResponse,
    ExecutionType,
    FlowRunStatus,
    SendFlowResponseRequest,
    TriggerHookType,
    UploadRunLogsRequest,
    WorkerJobType,
    isNil,
} from '@flow/shared'
import { DropdownState, DynamicPropsValue, PieceMetadata, PropertyType } from '@flow/pieces-framework'
import { pieceHelper } from '../../../../engine/src/lib/helper/piece-helper'
import { flowOperation } from '../../../../engine/src/lib/operations/flow.operation'
import { triggerHookOperation } from '../../../../engine/src/lib/operations/trigger-hook.operation'
import { progressService } from '../../../../engine/src/lib/services/progress.service'
import { workerSocket } from '../../../../engine/src/lib/worker-socket'
import { FlowSystemProp, QueueName, webhookSecretsUtils } from '@flow/server-common'
import { Worker, Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../database/redis-connections'
import { runsMetadataQueue } from '../flows/flow-run/flow-runs-queue'
import { system } from './system/system'
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
        await webhookSecretsUtils.init(system.getOrThrow(FlowSystemProp.APP_WEBHOOK_SECRETS))
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
                        case WorkerJobType.EXECUTE_FLOW: {
                            const flowVersion = await flowVersionRepo().findOneBy({ id: jobData.flowVersionId })
                            if (isNil(flowVersion)) {
                                throw new Error(`Flow version not found: ${jobData.flowVersionId}`)
                            }

                            const engineToken = await accessTokenManager(log).generateEngineToken({
                                jobId: jobData.runId,
                                projectId: jobData.projectId,
                                platformId: jobData.platformId,
                            })

                            const input: ExecuteFlowOperation = {
                                projectId: jobData.projectId,
                                platformId: jobData.platformId,
                                engineToken,
                                internalApiUrl: INTERNAL_API_URL,
                                publicApiUrl: PUBLIC_API_URL,
                                timeoutInSeconds: 600,
                                flowVersion,
                                flowRunId: jobData.runId,
                                executionType: jobData.executionType as ExecutionType.BEGIN,
                                runEnvironment: jobData.environment,
                                executionState: { steps: {}, tags: [] },
                                serverHandlerId: jobData.synchronousHandlerId ?? null,
                                httpRequestId: jobData.httpRequestId ?? null,
                                progressUpdateType: jobData.progressUpdateType,
                                stepNameToTest: jobData.stepNameToTest ?? null,
                                sampleData: jobData.sampleData,
                                logsUploadUrl: jobData.logsUploadUrl,
                                logsFileId: jobData.logsFileId,
                                triggerPayload: jobData.payload,
                                executeTrigger: jobData.executeTrigger ?? false,
                            }

                            // Override workerSocket to intercept engine events inline
                            // (mirrors upstream sandbox-event-handlers.ts)
                            const originalSend = workerSocket.sendToWorkerWithAck
                            workerSocket.sendToWorkerWithAck = async (event: EngineSocketEvent, data: unknown): Promise<void> => {
                                switch (event) {
                                    case EngineSocketEvent.UPLOAD_RUN_LOG: {
                                        const req = data as UploadRunLogsRequest
                                        await runsMetadataQueue(log).add({
                                            id: req.runId,
                                            projectId: req.projectId,
                                            status: req.status,
                                            failedStep: req.failedStep,
                                            startTime: req.startTime,
                                            finishTime: req.finishTime,
                                            logsFileId: req.logsFileId,
                                            tags: req.tags,
                                            pauseMetadata: req.pauseMetadata,
                                            stepsCount: req.stepsCount,
                                        })
                                        // Handle sync flow error response
                                        const nonSupportedStatuses = [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED, FlowRunStatus.PAUSED]
                                        if (!nonSupportedStatuses.includes(req.status) && !isNil(req.workerHandlerId) && !isNil(req.httpRequestId)) {
                                            await publishResponse(log, req.httpRequestId, req.workerHandlerId, getFlowErrorResponse(req.status))
                                        }
                                        break
                                    }
                                    case EngineSocketEvent.SEND_FLOW_RESPONSE: {
                                        const req = data as SendFlowResponseRequest
                                        if (req.workerHandlerId && req.httpRequestId) {
                                            await publishResponse(log, req.httpRequestId, req.workerHandlerId, req.runResponse)
                                        }
                                        break
                                    }
                                    case EngineSocketEvent.UPDATE_RUN_PROGRESS:
                                    case EngineSocketEvent.UPDATE_STEP_PROGRESS:
                                    case EngineSocketEvent.ENGINE_RESPONSE:
                                    case EngineSocketEvent.ENGINE_STDOUT:
                                    case EngineSocketEvent.ENGINE_STDERR:
                                        // No-op in inline mode (no frontend websocket, no sandbox)
                                        break
                                    default:
                                        log.debug({ event }, '[inlineWorker] Unhandled engine socket event')
                                }
                            }

                            // Start backup loop (mirrors engine/src/main.ts)
                            progressService.init()

                            try {
                                await flowOperation.execute(input)
                                log.info({ runId: jobData.runId }, '[inlineWorker] Flow execution completed')
                            }
                            finally {
                                await progressService.shutdown()
                                workerSocket.sendToWorkerWithAck = originalSend
                            }
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

function getFlowErrorResponse(status: FlowRunStatus): EngineHttpResponse {
    switch (status) {
        case FlowRunStatus.INTERNAL_ERROR:
            return { status: 500, body: { message: 'An internal error has occurred' }, headers: {} }
        case FlowRunStatus.FAILED:
        case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
            return { status: 500, body: { message: 'The flow has failed and there is no response returned' }, headers: {} }
        case FlowRunStatus.TIMEOUT:
            return { status: 504, body: { message: 'The request took too long to reply' }, headers: {} }
        case FlowRunStatus.QUOTA_EXCEEDED:
            return { status: 204, body: {}, headers: {} }
        default:
            throw new Error(`Unexpected flow run status: ${status}`)
    }
}

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
