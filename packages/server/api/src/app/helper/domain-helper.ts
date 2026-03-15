import { FlowSystemProp, networkUtils, WorkerSystemProp } from '@flow/server-common'
import { isNil } from '@flow/shared'
import { system } from './system/system'

/**
 * Community-edition domain helper — no custom domain support.
 * Always resolves URLs from FRONTEND_URL / INTERNAL_URL system properties.
 */
export const domainHelper = {
    async getPublicUrl({ path }: { path?: string, platformId?: string | null }): Promise<string> {
        return networkUtils.combineUrl(system.getOrThrow(WorkerSystemProp.FRONTEND_URL), path ?? '')
    },
    async getPublicApiUrl({ path, platformId }: { path?: string, platformId?: string | null }): Promise<string> {
        return domainHelper.getPublicUrl({ path: `/api/${cleanLeadingSlash(path ?? '')}`, platformId })
    },
    async getInternalUrl({ path }: { path: string, platformId?: string | null }): Promise<string> {
        const internalUrl = system.get(FlowSystemProp.INTERNAL_URL)
        if (!isNil(internalUrl)) {
            return networkUtils.combineUrl(internalUrl, path ?? '')
        }
        return this.getPublicUrl({ path })
    },
    async getInternalApiUrl({ path, platformId }: { path: string, platformId?: string | null }): Promise<string> {
        return this.getInternalUrl({ path: `/api/${cleanLeadingSlash(path ?? '')}`, platformId })
    },
    async getApiUrlForWorker({ path, platformId }: { path?: string, platformId?: string | null }): Promise<string> {
        const hasWorkerModule = system.isWorker()
        if (hasWorkerModule) {
            return networkUtils.combineUrl('http://127.0.0.1:3000', path ?? '')
        }
        return this.getInternalApiUrl({ path: path ?? '', platformId })
    },
}

function cleanLeadingSlash(path: string) {
    return path.startsWith('/') ? path.slice(1) : path
}
