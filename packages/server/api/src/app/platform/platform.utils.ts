import { PlatformId, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { platformService } from './platform.service'

export const platformUtils = {
    async getPlatformIdForRequest(req: FastifyRequest): Promise<PlatformId | null> {
        if (req.principal && req.principal.type !== PrincipalType.UNKNOWN && req.principal.type !== PrincipalType.WORKER) {
            return req.principal.platform.id
        }
        const oldestPlatform = await platformService(req.log).getOldestPlatform()
        return oldestPlatform?.id ?? null
    },
    isCustomerOnDedicatedDomain(_platform?: unknown): boolean {
        // Community edition has no custom domains
        return false
    },
}
