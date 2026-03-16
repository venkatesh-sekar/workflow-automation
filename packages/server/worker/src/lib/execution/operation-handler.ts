/**
 * Operation handler for inline (same-process) engine execution.
 *
 * Upstream: allocates a sandbox, mounts files, executes via sandbox process.
 * Our adaptation: calls engine operations directly in-process, using
 * AsyncLocalStorage to scope workerSocket overrides per-execution for
 * concurrency safety.
 */
import { AsyncLocalStorage } from 'node:async_hooks'
import {
    DropdownState,
    DynamicPropsValue,
    PieceMetadata,
    PropertyType,
} from '@flow/pieces-framework'
import { webhookSecretsUtils } from '@flow/server-common'
import {
    BeginExecuteFlowOperation,
    EngineResponseStatus,
    EngineSocketEvent,
    ExecuteActionResponse,
    ExecuteExtractPieceMetadataOperation,
    ExecuteFlowOperation,
    ExecutePropsOptions,
    ExecuteTriggerOperation,
    ExecuteTriggerResponse,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
    ExecuteToolResponse,
    PieceTriggerSettings,
    ResumeExecuteFlowOperation,
    TriggerHookType,
} from '@flow/shared'
import { trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { pieceHelper } from '../../../../engine/src/lib/helper/piece-helper'
import { flowOperation } from '../../../../engine/src/lib/operations/flow.operation'
import { triggerHookOperation } from '../../../../engine/src/lib/operations/trigger-hook.operation'
import { progressService } from '../../../../engine/src/lib/services/progress.service'
import { workerSocket } from '../../../../engine/src/lib/worker-socket'
import { createInlineEventHandler } from './sandbox-event-handlers'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'

const tracer = trace.getTracer('engine-runner')

type EventHandler = (event: EngineSocketEvent, data: unknown) => Promise<void>
const executionContext = new AsyncLocalStorage<EventHandler>()

// One-time global override of workerSocket.sendToWorkerWithAck
// Routes events to the handler stored in AsyncLocalStorage for the current execution
let isOverrideInstalled = false
function ensureSocketOverride(): void {
    if (isOverrideInstalled) return
    const originalSend = workerSocket.sendToWorkerWithAck
    workerSocket.sendToWorkerWithAck = async (event: EngineSocketEvent, data: unknown): Promise<void> => {
        const handler = executionContext.getStore()
        if (handler) {
            return handler(event, data)
        }
        return originalSend.call(workerSocket, event, data)
    }
    isOverrideInstalled = true
}


export const operationHandler = (log: FastifyBaseLogger) => ({
    async executeFlow(engineToken: string, operation: Omit<BeginExecuteFlowOperation, EngineConstants> | Omit<ResumeExecuteFlowOperation, EngineConstants>): Promise<OperationResponse<EngineHelperFlowResult>> {
        return tracer.startActiveSpan('engineRunner.executeFlow', {
            attributes: {
                'flow.versionId': operation.flowVersion.id,
                'flow.projectId': operation.projectId,
                'flow.platformId': operation.platformId,
            },
        }, async (span) => {
            try {
                log.debug({
                    flowVersion: operation.flowVersion.id,
                    projectId: operation.projectId,
                }, '[operationHandler#executeFlow]')

                const input: ExecuteFlowOperation = {
                    ...operation,
                    engineToken,
                    publicApiUrl: workerMachine.getPublicApiUrl(),
                    internalApiUrl: workerMachine.getInternalApiUrl(),
                }

                ensureSocketOverride()
                const handler = createInlineEventHandler(log)

                return await executionContext.run(handler, async () => {
                    progressService.init()
                    try {
                        await flowOperation.execute(input)
                        return {
                            status: EngineResponseStatus.OK,
                            result: {} as EngineHelperFlowResult,
                            standardError: '',
                            standardOutput: '',
                        }
                    }
                    finally {
                        await progressService.shutdown()
                    }
                })
            }
            finally {
                span.end()
            }
        })
    },
    async executeTrigger<T extends TriggerHookType>(engineToken: string, operation: Omit<ExecuteTriggerOperation<T>, EngineConstants>): Promise<OperationResponse<EngineHelperTriggerResult<T>>> {
        log.debug({
            hookType: operation.hookType,
            projectId: operation.projectId,
        }, '[operationHandler#executeTrigger]')

        const triggerSettings = operation.flowVersion.trigger.settings as PieceTriggerSettings

        const input: ExecuteTriggerOperation<TriggerHookType> = {
            platformId: operation.platformId,
            projectId: operation.projectId,
            hookType: operation.hookType,
            webhookUrl: operation.webhookUrl,
            triggerPayload: operation.triggerPayload,
            test: operation.test,
            flowVersion: operation.flowVersion,
            appWebhookUrl: await webhookUtils(log).getAppWebhookUrl({
                appName: triggerSettings.pieceName,
                publicApiUrl: workerMachine.getPublicApiUrl(),
            }),
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            webhookSecret: await webhookSecretsUtils.getWebhookSecret(operation.flowVersion),
            engineToken,
            timeoutInSeconds: operation.timeoutInSeconds,
        }

        const engineResponse = await triggerHookOperation.execute(input)

        return {
            status: engineResponse.status,
            result: engineResponse.response as EngineHelperTriggerResult<T>,
            standardError: '',
            standardOutput: '',
        }
    },
    async extractPieceMetadata(operation: ExecuteExtractPieceMetadataOperation): Promise<OperationResponse<PieceMetadata>> {
        log.debug({ operation }, '[operationHandler#extractPieceMetadata]')

        const { timeoutInSeconds: _timeout, ...extractParams } = operation
        const result = await pieceHelper.extractPieceMetadata({
            params: extractParams,
        })

        return {
            status: EngineResponseStatus.OK,
            result,
            standardError: '',
            standardOutput: '',
        }
    },
    async executeValidateAuth(engineToken: string, operation: Omit<ExecuteValidateAuthOperation, EngineConstants>): Promise<OperationResponse<ExecuteValidateAuthResponse>> {
        log.debug({ ...operation.piece, platformId: operation.platformId }, '[operationHandler#executeValidateAuth]')

        const result = await pieceHelper.executeValidateAuth({
            params: {
                ...operation,
                publicApiUrl: workerMachine.getPublicApiUrl(),
                internalApiUrl: workerMachine.getInternalApiUrl(),
                engineToken,
                timeoutInSeconds: operation.timeoutInSeconds,
            },
        })

        return {
            status: EngineResponseStatus.OK,
            result,
            standardError: '',
            standardOutput: '',
        }
    },
    async executeProp(engineToken: string, operation: Omit<ExecutePropsOptions, EngineConstants>): Promise<OperationResponse<EngineHelperPropResult>> {
        log.info({
            piece: operation.piece,
            propertyName: operation.propertyName,
            stepName: operation.actionOrTriggerName,
        }, '[operationHandler#executeProp]')

        const result = await pieceHelper.executeProps({
            pieceName: operation.piece.pieceName,
            pieceVersion: operation.piece.pieceVersion,
            propertyName: operation.propertyName,
            actionOrTriggerName: operation.actionOrTriggerName,
            input: operation.input,
            sampleData: operation.sampleData ?? {},
            flowVersion: operation.flowVersion,
            projectId: operation.projectId,
            platformId: operation.platformId,
            engineToken,
            internalApiUrl: workerMachine.getInternalApiUrl(),
            publicApiUrl: workerMachine.getPublicApiUrl(),
            searchValue: operation.searchValue,
            timeoutInSeconds: operation.timeoutInSeconds,
        })

        return {
            status: EngineResponseStatus.OK,
            result: result as EngineHelperPropResult,
            standardError: '',
            standardOutput: '',
        }
    },
})


// Types
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


type EngineConstants = 'publicApiUrl' | 'internalApiUrl' | 'engineToken'

export type OperationResult =
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
