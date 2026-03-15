import { TemplateTelemetryEvent } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'

export const templateTelemetryService = (_log: FastifyBaseLogger) => ({
    sendEvent(_event: TemplateTelemetryEvent): void {
        // No-op: template telemetry removed (internal tool, no external reporting)
    },
})
