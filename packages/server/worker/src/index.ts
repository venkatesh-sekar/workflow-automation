export * from './lib/utils/machine'
export * from './lib/execution/operation-handler'
export * from './lib/consume/executors/flow-job-executor'
export * from './lib/utils/webhook-utils'
export * from './lib/flow-worker'
import { FastifyBaseLogger } from 'fastify'

// Stub exports for packageManager and registryPieceManager
// These are imported by system-validator.ts for startup validation.
// In inline mode, pieces are loaded in-process so no external validation is needed.
export const packageManager = (_log: FastifyBaseLogger) => ({
    async validate(): Promise<void> { /* no-op in inline mode */ },
})

export const registryPieceManager = (_log: FastifyBaseLogger) => ({
    async validate(): Promise<void> { /* no-op in inline mode */ },
})
