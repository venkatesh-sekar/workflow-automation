/**
 * Event handlers for engine events in inline execution mode.
 *
 * Upstream: receives Socket.io events from sandbox processes and routes to appSocket.
 * Our adaptation: handles events from workerSocket.sendToWorkerWithAck override,
 * publishes responses via Redis pubsub, and enqueues run metadata updates.
 */
import { pubsubFactory } from '@flow/server-common'
import { EngineHttpResponse, EngineSocketEvent, FlowRunStatus, isFlowRunStateTerminal, isNil, SendFlowResponseRequest, StepRunResponse, UpdateRunProgressRequest, UploadRunLogsRequest, WebsocketServerEvent } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { runsMetadataQueue } from '../flow-worker'
import { workerRedisConnections } from '../utils/worker-redis'

const pubsub = pubsubFactory(workerRedisConnections.create)

/**
 * Creates an event handler function for use with AsyncLocalStorage in operation-handler.
 * This handler routes engine socket events to the appropriate destinations.
 */
export function createInlineEventHandler(log: FastifyBaseLogger): (event: EngineSocketEvent, data: unknown) => Promise<void> {
    const handlers = sandboxEventHandlers(log)
    return async (event: EngineSocketEvent, data: unknown): Promise<void> => {
        switch (event) {
            case EngineSocketEvent.SEND_FLOW_RESPONSE:
                await handlers.sendFlowResponse(data as SendFlowResponseRequest)
                break
            case EngineSocketEvent.UPLOAD_RUN_LOG:
                await handlers.uploadRunLogs(data as UploadRunLogsRequest)
                break
            case EngineSocketEvent.UPDATE_RUN_PROGRESS:
                await handlers.updateRunProgress(data as UpdateRunProgressRequest)
                break
            case EngineSocketEvent.UPDATE_STEP_PROGRESS:
                await handlers.updateStepProgress(data as UpdateStepProgressRequest)
                break
            default:
                // ENGINE_RESPONSE, ENGINE_STDOUT, ENGINE_STDERR are no-op in inline mode
                break
        }
    }
}

export const sandboxEventHandlers = (log: FastifyBaseLogger) => ({
    sendFlowResponse: async (request: SendFlowResponseRequest): Promise<void> => {
        const { workerHandlerId, httpRequestId, runResponse } = request
        await publishEngineResponse(log, {
            requestId: httpRequestId,
            workerServerId: workerHandlerId,
            response: runResponse,
        })
    },
    sendUserInteractionResponse: async <T>(request: PublishEngineResponseRequest<T>): Promise<void> => {
        const { requestId, workerServerId, response } = request
        await publishEngineResponse(log, {
            requestId,
            workerServerId,
            response,
        })
    },
    uploadRunLogs: async (request: UploadRunLogsRequest): Promise<void> => {
        const { runId, projectId, workerHandlerId, status, tags, httpRequestId, stepNameToTest, logsFileId, failedStep, startTime, finishTime, stepResponse, pauseMetadata, stepsCount } = request
        const nonSupportedStatuses = [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED, FlowRunStatus.PAUSED]
        if (!nonSupportedStatuses.includes(status) && !isNil(workerHandlerId) && !isNil(httpRequestId)) {
            await publishEngineResponse(log, {
                requestId: httpRequestId,
                workerServerId: workerHandlerId,
                response: await getFlowResponse(status),
            })
        }

        await runsMetadataQueue.add({
            id: runId,
            status,
            failedStep,
            startTime,
            finishTime,
            logsFileId,
            projectId,
            tags,
            pauseMetadata,
            stepsCount,
        })

        if (!isNil(stepNameToTest) && !isNil(stepResponse)) {
            const isTerminalOutput = isFlowRunStateTerminal({
                status,
                ignoreInternalError: false,
            })

            // In inline mode, we log step progress but don't emit via websocket
            // since we don't have a direct appSocket connection.
            // The frontend gets updates via the runs metadata queue.
            log.debug({
                projectId,
                stepNameToTest,
                isTerminalOutput,
                event: isTerminalOutput ? WebsocketServerEvent.EMIT_TEST_STEP_FINISHED : WebsocketServerEvent.EMIT_TEST_STEP_PROGRESS,
            }, '[sandboxEventHandlers] Step progress update')
        }
    },
    updateStepProgress: async (request: UpdateStepProgressRequest): Promise<void> => {
        // In inline mode, step progress is handled via the runs metadata queue
        log.debug({ projectId: request.projectId }, '[sandboxEventHandlers] Step progress update (no-op in inline mode)')
    },
    updateRunProgress: async (request: UpdateRunProgressRequest): Promise<void> => {
        // In inline mode, run progress is handled via the runs metadata queue
        log.debug({ request }, '[sandboxEventHandlers] Run progress update (no-op in inline mode)')
    },
})

async function publishEngineResponse<T>(log: FastifyBaseLogger, request: PublishEngineResponseRequest<T>): Promise<void> {
    const { requestId, workerServerId, response } = request
    log.info({ requestId }, '[engineResponsePublisher#publishEngineResponse]')
    const message: EngineResponseWithId<T> = { requestId, response }
    await pubsub.publish(`engine-run:sync:${workerServerId}`, JSON.stringify(message))
}


async function getFlowResponse(status: FlowRunStatus): Promise<EngineHttpResponse> {
    switch (status) {
        case FlowRunStatus.INTERNAL_ERROR:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'An internal error has occurred',
                },
                headers: {},
            }
        case FlowRunStatus.FAILED:
        case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'The flow has failed and there is no response returned',
                },
                headers: {},
            }
        case FlowRunStatus.TIMEOUT:
            return {
                status: StatusCodes.GATEWAY_TIMEOUT,
                body: {
                    message: 'The request took too long to reply',
                },
                headers: {},
            }
        case FlowRunStatus.QUOTA_EXCEEDED:
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
        default:
            throw new Error(`Unexpected flow run status: ${status}`)
    }
}


type PublishEngineResponseRequest<T> = {
    requestId: string
    workerServerId: string
    response: T
}

type EngineResponseWithId<T> = { requestId: string, response: T }

type UpdateStepProgressRequest = {
    projectId: string
    stepResponse: StepRunResponse
}
