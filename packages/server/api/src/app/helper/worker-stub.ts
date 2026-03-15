/**
 * Stub for the 'worker' module — the worker package was not copied into Flow.
 * Provides type definitions and no-op value exports so server/api compiles.
 * Real worker functionality will run in a separate worker process.
 */
import {
    EngineResponseStatus,
    ExecuteActionResponse,
    ExecuteToolResponse,
    ExecuteTriggerResponse,
    ExecuteValidateAuthResponse,
    TriggerHookType,
} from '@activepieces/shared'
import { DropdownState, DynamicPropsValue, PieceMetadata, PropertyType } from '@activepieces/pieces-framework'
import { FastifyBaseLogger } from 'fastify'

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

// Value exports — no-op stubs
export const flowWorker = (_log: FastifyBaseLogger) => ({
    async init(_opts: { workerToken: string, markAsHealthy: () => Promise<void> }): Promise<void> { /* no-op */ },
    async close(): Promise<void> { /* no-op */ },
})

export const packageManager = (_log: FastifyBaseLogger) => ({
    async validate(): Promise<void> { /* no-op */ },
})

export const registryPieceManager = (_log: FastifyBaseLogger) => ({
    async validate(): Promise<void> { /* no-op */ },
})
