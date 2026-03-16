/**
 * Worker machine configuration.
 * In our inline model, settings are populated by the API's machineService
 * rather than fetched via socket from a remote server.
 */
import { environmentVariables, exceptionHandler, webhookSecretsUtils, FlowWorkerSystemProp } from '@flow/server-common'
import { flowId, assertNotNullOrUndefined, isNil, spreadIfDefined, WorkerSettingsResponse } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'

let settings: WorkerSettingsResponse | undefined
let workerToken: string | undefined
const workerId = flowId()

export const workerMachine = {
    getWorkerId: () => workerId,
    getWorkerToken: () => {
        assertNotNullOrUndefined(workerToken, 'Worker token is not set')
        return workerToken
    },
    isDedicatedWorker: () => {
        return !isNil(settings?.PLATFORM_ID_FOR_DEDICATED_WORKER)
    },
    init: async (_settings: WorkerSettingsResponse, _workerToken: string, _log: FastifyBaseLogger) => {
        settings = {
            ..._settings,
            ...spreadIfDefined('WORKER_CONCURRENCY', environmentVariables.getNumberEnvironment(FlowWorkerSystemProp.WORKER_CONCURRENCY)),
            ...spreadIfDefined('PLATFORM_ID_FOR_DEDICATED_WORKER', environmentVariables.getEnvironment(FlowWorkerSystemProp.PLATFORM_ID_FOR_DEDICATED_WORKER)),
        }

        workerToken = _workerToken

        await webhookSecretsUtils.init(settings.APP_WEBHOOK_SECRETS)
    },
    hasSettings: () => {
        return !isNil(settings)
    },
    getSettings: () => {
        assertNotNullOrUndefined(settings, 'Settings are not set')
        return settings
    },
    getSettingOrThrow: (prop: keyof WorkerSettingsResponse) => {
        assertNotNullOrUndefined(settings, 'Settings are not set')
        return settings[prop]
    },
    getInternalApiUrl: (): string => {
        if (environmentVariables.hasAppModules()) {
            return 'http://127.0.0.1:3000/'
        }
        const url = environmentVariables.getEnvironmentOrThrow(FlowWorkerSystemProp.FRONTEND_URL)
        return appendSlashAndApi(replaceLocalhost(url))
    },
    getSocketUrlAndPath: (): { url: string, path: string } => {
        if (environmentVariables.hasAppModules()) {
            return {
                url: 'http://127.0.0.1:3000/',
                path: '/socket.io',
            }
        }
        const url = environmentVariables.getEnvironmentOrThrow(FlowWorkerSystemProp.FRONTEND_URL)
        return {
            url: removeTrailingSlash(replaceLocalhost(url)),
            path: '/api/socket.io',
        }
    },
    getPublicApiUrl: (): string => {
        return appendSlashAndApi(replaceLocalhost(getPublicUrl()))
    },
    getPlatformIdForDedicatedWorker: (): string | undefined => {
        return environmentVariables.getEnvironment(FlowWorkerSystemProp.PLATFORM_ID_FOR_DEDICATED_WORKER)
    },
}

function getPublicUrl(): string {
    if (isNil(settings)) {
        const url = environmentVariables.getEnvironmentOrThrow(FlowWorkerSystemProp.FRONTEND_URL)
        return url
    }
    return settings.PUBLIC_URL
}

function replaceLocalhost(urlString: string): string {
    const url = new URL(urlString)
    if (url.hostname === 'localhost') {
        url.hostname = '127.0.0.1'
    }
    return url.toString()
}

function removeTrailingSlash(url: string): string {
    return url.replace(/\/$/, '')
}

function appendSlashAndApi(url: string): string {
    const slash = url.endsWith('/') ? '' : '/'
    return `${url}${slash}api/`
}
