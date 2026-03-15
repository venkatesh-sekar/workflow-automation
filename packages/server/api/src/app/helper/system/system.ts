import os from 'os'
import path from 'path'
import { FlowSystemProp, ContainerType, DatabaseType, environmentVariables, pinoLogging, RedisType, SystemProp, FlowWorkerSystemProp } from '@flow/server-common'
import {
    FlowError,
    FlowEdition,
    ErrorCode,
    ExecutionMode,
    FileLocation,
    isNil,
} from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'
import { Level } from 'pino'



const systemPropDefaultValues: Partial<Record<SystemProp, string>> = {
    [FlowSystemProp.API_RATE_LIMIT_AUTHN_ENABLED]: 'true',
    [FlowSystemProp.API_RATE_LIMIT_AUTHN_MAX]: '50',
    [FlowSystemProp.API_RATE_LIMIT_AUTHN_WINDOW]: '1 minute',
    [FlowSystemProp.PM2_ENABLED]: 'false',
    [FlowSystemProp.CLIENT_REAL_IP_HEADER]: 'x-real-ip',
    [FlowSystemProp.CLOUD_AUTH_ENABLED]: 'true',
    [FlowSystemProp.CONFIG_PATH]: path.join(os.homedir(), '.flow'),
    [FlowSystemProp.DB_TYPE]: DatabaseType.POSTGRES,
    [FlowSystemProp.EDITION]: FlowEdition.COMMUNITY,
    [FlowSystemProp.APP_WEBHOOK_SECRETS]: '{}',
    [FlowWorkerSystemProp.CONTAINER_TYPE]: ContainerType.WORKER_AND_APP,
    [FlowSystemProp.EXECUTION_DATA_RETENTION_DAYS]: '30',
    [FlowSystemProp.PAUSED_FLOW_TIMEOUT_DAYS]: '30',
    [FlowSystemProp.PIECES_CACHE_MAX_ENTRIES]: '1000',
    [FlowSystemProp.ENVIRONMENT]: 'prod',
    [FlowSystemProp.EXECUTION_MODE]: ExecutionMode.UNSANDBOXED,
    [FlowWorkerSystemProp.WORKER_CONCURRENCY]: '5',
    [FlowSystemProp.WEBHOOK_TIMEOUT_SECONDS]: '30',
    [FlowSystemProp.LOG_LEVEL]: 'info',
    [FlowSystemProp.LOG_PRETTY]: 'false',
    [FlowSystemProp.S3_USE_SIGNED_URLS]: 'false',
    [FlowSystemProp.MAX_FILE_SIZE_MB]: '25',
    [FlowSystemProp.MAX_FLOW_RUN_LOG_SIZE_MB]: '25',
    [FlowSystemProp.FILE_STORAGE_LOCATION]: FileLocation.DB,
    [FlowSystemProp.SANDBOX_MEMORY_LIMIT]: '1048576',
    [FlowSystemProp.FLOW_TIMEOUT_SECONDS]: '600',
    [FlowSystemProp.TRIGGER_TIMEOUT_SECONDS]: '60',
    [FlowSystemProp.RUNS_METADATA_UPDATE_CONCURRENCY]: '10',
    [FlowSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS]: '180',
    [FlowSystemProp.EVENT_DESTINATION_TIMEOUT_SECONDS]: '10',
    [FlowSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS]: '30',
    [FlowSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT]: '100000',
    [FlowSystemProp.REDIS_TYPE]: RedisType.STANDALONE,
    [FlowSystemProp.TRIGGER_DEFAULT_POLL_INTERVAL]: '5',
    [FlowSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT]: '100',
    [FlowSystemProp.PROJECT_RATE_LIMITER_ENABLED]: 'false',
    [FlowSystemProp.MAX_RECORDS_PER_TABLE]: '10000',
    [FlowSystemProp.MAX_FIELDS_PER_TABLE]: '100',
    [FlowSystemProp.ENABLE_FLOW_ON_PUBLISH]: 'true',
    [FlowSystemProp.ISSUE_ARCHIVE_DAYS]: '7',
    [FlowSystemProp.POSTGRES_IDLE_TIMEOUT_MS]: '300000',
}

let globalLogger: FastifyBaseLogger
export const system = {
    globalLogger(): FastifyBaseLogger {
        if (isNil(globalLogger)) {
            const logLevel: Level = this.get(FlowSystemProp.LOG_LEVEL) ?? 'info'
            const logPretty = this.getBoolean(FlowSystemProp.LOG_PRETTY) ?? false
            const lokiUrl = this.get(FlowSystemProp.LOKI_URL)
            const lokiPassword = this.get(FlowSystemProp.LOKI_PASSWORD)
            const lokiUsername = this.get(FlowSystemProp.LOKI_USERNAME)
            const hyperdxToken = this.get(FlowSystemProp.HYPERDX_TOKEN)
            globalLogger = pinoLogging.initLogger(logLevel, logPretty, {
                url: lokiUrl,
                password: lokiPassword,
                username: lokiUsername,
            }, {
                token: hyperdxToken,
            })
        }
        return globalLogger
    },
    get<T extends string>(prop: SystemProp): T | undefined {
        return getEnvVarOrReturnDefaultValue(prop) as T | undefined
    },

    getNumberOrThrow(prop: SystemProp): number {
        const value = system.getNumber(prop)

        if (isNil(value)) {
            throw new FlowError(
                {
                    code: ErrorCode.SYSTEM_PROP_NOT_DEFINED,
                    params: {
                        prop,
                    },
                },
                `System property FLOW_${prop} is not defined, please check the documentation`,
            )
        }
        return value

    },
    getNumber(prop: SystemProp): number | null {
        const stringNumber = getEnvVarOrReturnDefaultValue(prop)

        if (!stringNumber) {
            return null
        }

        const parsedNumber = Number.parseInt(stringNumber, 10)

        if (Number.isNaN(parsedNumber)) {
            return null
        }

        return parsedNumber
    },

    getBoolean(prop: SystemProp): boolean | undefined {
        const value = getEnvVarOrReturnDefaultValue(prop)

        if (isNil(value)) {
            return undefined
        }
        return value === 'true'
    },

    getBooleanOrThrow(prop: SystemProp): boolean {
        const value = this.getBoolean(prop)
        if (isNil(value)) {
            throw new FlowError(
                {
                    code: ErrorCode.SYSTEM_PROP_NOT_DEFINED,
                    params: {
                        prop,
                    },
                },
                `System property FLOW_${prop} is not defined, please check the documentation`,
            )
        }
        return value
    },
    getList(prop: SystemProp): string[] {
        const values = getEnvVarOrReturnDefaultValue(prop)

        if (isNil(values)) {
            return []
        }
        return values.split(',').map((value) => value.trim())
    },
    getOrThrow<T extends string>(prop: SystemProp): T {
        const value = getEnvVarOrReturnDefaultValue(prop) as T | undefined

        if (value === undefined) {
            throw new FlowError(
                {
                    code: ErrorCode.SYSTEM_PROP_NOT_DEFINED,
                    params: {
                        prop,
                    },
                },
                `System property FLOW_${prop} is not defined, please check the documentation`,
            )
        }

        return value
    },
    getEdition(): FlowEdition {
        return this.getOrThrow<FlowEdition>(FlowSystemProp.EDITION)
    },
    isWorker(): boolean {
        return [ContainerType.WORKER, ContainerType.WORKER_AND_APP].includes(
            this.getOrThrow<ContainerType>(FlowWorkerSystemProp.CONTAINER_TYPE),
        )
    },
    isApp(): boolean {
        return [ContainerType.APP, ContainerType.WORKER_AND_APP].includes(
            this.getOrThrow<ContainerType>(FlowWorkerSystemProp.CONTAINER_TYPE),
        )
    },
}

const getEnvVarOrReturnDefaultValue = (prop: SystemProp): string | undefined => {
    return environmentVariables.getEnvironment(prop) ?? systemPropDefaultValues[prop]
}
