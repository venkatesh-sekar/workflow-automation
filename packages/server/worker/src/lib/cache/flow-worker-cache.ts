/**
 * Minimal flow version cache for inline execution.
 * Fetches flow versions via the engine API service (HTTP to localhost).
 * No disk caching — in inline mode, the API is in the same process.
 */
import { FlowVersion } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService } from '../api/server-api.service'

export const flowWorkerCache = (log: FastifyBaseLogger) => ({
    async getVersion({ engineToken, flowVersionId }: { engineToken: string, flowVersionId: string }): Promise<FlowVersion | null> {
        log.debug({ flowVersionId }, '[flowWorkerCache#getVersion]')
        return engineApiService(engineToken).getFlowVersion({ versionId: flowVersionId })
    },
})
