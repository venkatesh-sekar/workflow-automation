import { ProjectId, TelemetryEvent, User, UserIdentity, UserId } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'

export const telemetry = (_log: FastifyBaseLogger) => ({
    async identify(_user: User, _identity: UserIdentity, _projectId: ProjectId): Promise<void> {
        // no-op: telemetry removed
    },
    async trackPlatform(_platformId: ProjectId, _event: TelemetryEvent): Promise<void> {
        // no-op: telemetry removed
    },
    async trackProject(
        _projectId: ProjectId,
        _event: TelemetryEvent,
    ): Promise<void> {
        // no-op: telemetry removed
    },
    isEnabled: () => false,
    async trackUser(_userId: UserId, _event: TelemetryEvent): Promise<void> {
        // no-op: telemetry removed
    },
})
