import { inspect } from 'util'
import { FlowSystemProp, ContainerType, DatabaseType, RedisType, SystemProp, FlowWorkerSystemProp } from '@flow/server-common'
import { FlowEdition, FlowEnvironment, DefaultProjectRole, ExecutionMode, FileLocation, isNil } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'
import { packageManager, registryPieceManager } from 'worker'
import { s3Helper } from '../file/s3-helper'
import { encryptUtils } from './encryption'
import { jwtUtils } from './jwt-utils'
import { system } from './system/system'


function enumValidator<T extends string>(enumValues: T[]) {
    return (value: string) => {
        const isValid = enumValues.includes(value as T)
        return isValid ? true : `Value must be one of: ${enumValues.join(', ')}`
    }
}

function booleanValidator(value: string | undefined) {
    const isValid = value === 'true' || value === 'false'
    return isValid ? true : 'Value must be either "true" or "false"'
}

function numberValidator(value: string | undefined) {
    const isValid = !isNil(value) && !Number.isNaN(Number(value))
    return isValid ? true : 'Value must be a valid number'
}

function stringValidator(value: string) {
    const isValid = typeof value === 'string' && value.length > 0
    return isValid ? true : 'Value must be a non-empty string'
}

function urlValidator(value: string) {
    try {
        new URL(value)
        return true
    }
    catch {
        return 'Value must be a valid URL'
    }
}

const systemPropValidators: {
    [key in SystemProp]: (value: string) => true | string
} = {
    // FlowSystemProp
    [FlowSystemProp.ADMIN_EMAIL]: stringValidator,
    [FlowSystemProp.ADMIN_API_KEY]: stringValidator,
    [FlowSystemProp.EXECUTION_MODE]: enumValidator(Object.values(ExecutionMode)),
    [FlowSystemProp.SKIP_PROJECT_LIMITS_CHECK]: booleanValidator,
    [FlowSystemProp.LOG_LEVEL]: enumValidator(['error', 'warn', 'info', 'debug', 'trace']),
    [FlowSystemProp.LOG_PRETTY]: booleanValidator,
    [FlowSystemProp.ENVIRONMENT]: enumValidator(Object.values(FlowEnvironment)),
    [FlowSystemProp.TRIGGER_TIMEOUT_SECONDS]: numberValidator,
    [FlowSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS]: numberValidator,
    [FlowSystemProp.FLOW_TIMEOUT_SECONDS]: numberValidator,
    [FlowSystemProp.EVENT_DESTINATION_TIMEOUT_SECONDS]: numberValidator,
    [FlowSystemProp.PAUSED_FLOW_TIMEOUT_DAYS]: numberValidator,
    [FlowSystemProp.APP_WEBHOOK_SECRETS]: stringValidator,
    [FlowSystemProp.MAX_FILE_SIZE_MB]: numberValidator,
    [FlowSystemProp.MAX_FLOW_RUN_LOG_SIZE_MB]: numberValidator,
    [FlowSystemProp.SANDBOX_MEMORY_LIMIT]: numberValidator,
    [FlowSystemProp.SANDBOX_PROPAGATED_ENV_VARS]: stringValidator,
    [FlowSystemProp.RUNS_METADATA_UPDATE_CONCURRENCY]: numberValidator,
    [FlowSystemProp.LOKI_PASSWORD]: stringValidator,
    [FlowSystemProp.LOKI_URL]: urlValidator,
    [FlowSystemProp.LOKI_USERNAME]: stringValidator,

    [FlowSystemProp.OTEL_ENABLED]: booleanValidator,
    [FlowSystemProp.HYPERDX_TOKEN]: stringValidator,
    [FlowWorkerSystemProp.FRONTEND_URL]: urlValidator,
    [FlowWorkerSystemProp.CONTAINER_TYPE]: enumValidator(Object.values(ContainerType)),
    [FlowWorkerSystemProp.WORKER_TOKEN]: stringValidator,
    [FlowWorkerSystemProp.PLATFORM_ID_FOR_DEDICATED_WORKER]: stringValidator,
    [FlowWorkerSystemProp.PRE_WARM_CACHE]: booleanValidator,
    // FlowSystemProp
    [FlowSystemProp.API_KEY]: stringValidator,
    [FlowSystemProp.TEMPLATES_API_KEY]: stringValidator,
    [FlowSystemProp.API_RATE_LIMIT_AUTHN_ENABLED]: booleanValidator,
    [FlowSystemProp.API_RATE_LIMIT_AUTHN_MAX]: numberValidator,
    [FlowSystemProp.API_RATE_LIMIT_AUTHN_WINDOW]: stringValidator,
    [FlowSystemProp.CLIENT_REAL_IP_HEADER]: stringValidator,
    [FlowSystemProp.CLOUD_AUTH_ENABLED]: booleanValidator,
    [FlowSystemProp.CONFIG_PATH]: stringValidator,
    [FlowSystemProp.DB_TYPE]: enumValidator(Object.values(DatabaseType)),
    [FlowSystemProp.ENCRYPTION_KEY]: stringValidator,
    [FlowSystemProp.EXECUTION_DATA_RETENTION_DAYS]: numberValidator,
    [FlowSystemProp.JWT_SECRET]: stringValidator,
    [FlowSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT]: numberValidator,
    [FlowSystemProp.PIECES_CACHE_MAX_ENTRIES]: numberValidator,
    [FlowSystemProp.POSTGRES_DATABASE]: stringValidator,
    [FlowSystemProp.POSTGRES_HOST]: stringValidator,
    [FlowSystemProp.POSTGRES_PASSWORD]: stringValidator,
    [FlowSystemProp.POSTGRES_PORT]: numberValidator,
    [FlowSystemProp.POSTGRES_SSL_CA]: stringValidator,
    [FlowSystemProp.POSTGRES_URL]: stringValidator,
    [FlowSystemProp.POSTGRES_USERNAME]: stringValidator,
    [FlowSystemProp.POSTGRES_USE_SSL]: booleanValidator,
    [FlowSystemProp.POSTGRES_POOL_SIZE]: numberValidator,
    [FlowSystemProp.POSTGRES_IDLE_TIMEOUT_MS]: numberValidator,
    [FlowSystemProp.PROJECT_RATE_LIMITER_ENABLED]: booleanValidator,
    [FlowSystemProp.QUEUE_UI_ENABLED]: booleanValidator,
    [FlowSystemProp.QUEUE_UI_PASSWORD]: stringValidator,
    [FlowSystemProp.QUEUE_UI_USERNAME]: stringValidator,
    [FlowSystemProp.REDIS_TYPE]: enumValidator(Object.values(RedisType)),
    [FlowSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS]: numberValidator,
    [FlowSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT]: numberValidator,
    [FlowSystemProp.REDIS_SSL_CA_FILE]: stringValidator,
    [FlowSystemProp.REDIS_DB]: numberValidator,
    [FlowSystemProp.REDIS_HOST]: stringValidator,
    [FlowSystemProp.REDIS_PASSWORD]: stringValidator,
    [FlowSystemProp.REDIS_PORT]: numberValidator,
    [FlowSystemProp.REDIS_URL]: stringValidator,
    [FlowSystemProp.REDIS_USER]: stringValidator,
    [FlowSystemProp.REDIS_USE_SSL]: booleanValidator,
    [FlowSystemProp.REDIS_SENTINEL_ROLE]: stringValidator,
    [FlowSystemProp.REDIS_SENTINEL_HOSTS]: stringValidator,
    [FlowSystemProp.REDIS_SENTINEL_NAME]: stringValidator,
    [FlowSystemProp.S3_ACCESS_KEY_ID]: stringValidator,
    [FlowSystemProp.S3_BUCKET]: stringValidator,
    [FlowSystemProp.S3_ENDPOINT]: stringValidator,
    [FlowSystemProp.S3_REGION]: stringValidator,
    [FlowSystemProp.S3_SECRET_ACCESS_KEY]: stringValidator,
    [FlowSystemProp.S3_USE_SIGNED_URLS]: booleanValidator,
    [FlowSystemProp.S3_USE_IRSA]: booleanValidator,
    [FlowSystemProp.SMTP_HOST]: stringValidator,
    [FlowSystemProp.SMTP_PASSWORD]: stringValidator,
    [FlowSystemProp.SMTP_PORT]: numberValidator,
    [FlowSystemProp.SMTP_SENDER_EMAIL]: (value: string) => value.includes('@') ? true : 'Value must be a valid email address',
    [FlowSystemProp.SMTP_SENDER_NAME]: stringValidator,
    [FlowSystemProp.SMTP_USERNAME]: stringValidator,
    [FlowSystemProp.TELEMETRY_ENABLED]: booleanValidator,
    [FlowSystemProp.TRIGGER_DEFAULT_POLL_INTERVAL]: numberValidator,
    [FlowSystemProp.WEBHOOK_TIMEOUT_SECONDS]: numberValidator,
    [FlowSystemProp.APPSUMO_TOKEN]: stringValidator,
    [FlowSystemProp.FILE_STORAGE_LOCATION]: enumValidator(Object.values(FileLocation)),
    [FlowSystemProp.FIREBASE_ADMIN_CREDENTIALS]: stringValidator,
    [FlowSystemProp.FIREBASE_HASH_PARAMETERS]: stringValidator,
    [FlowSystemProp.STRIPE_SECRET_KEY]: stringValidator,
    [FlowSystemProp.STRIPE_WEBHOOK_SECRET]: stringValidator,
    [FlowSystemProp.INTERNAL_URL]: stringValidator,
    [FlowSystemProp.PM2_ENABLED]: booleanValidator,
    [FlowSystemProp.EDITION]: enumValidator(Object.values(FlowEdition)),
    [FlowSystemProp.FEATUREBASE_API_KEY]: stringValidator,
    [FlowSystemProp.SCIM_DEFAULT_PROJECT_ROLE]: enumValidator(Object.values(DefaultProjectRole)),

    // FlowSystemProp
    [FlowWorkerSystemProp.WORKER_CONCURRENCY]: numberValidator,

    // Cloud
    [FlowSystemProp.GOOGLE_CLIENT_ID]: stringValidator,
    [FlowSystemProp.GOOGLE_CLIENT_SECRET]: stringValidator,

    // Cloudflare
    [FlowSystemProp.CLOUDFLARE_API_TOKEN]: stringValidator,
    [FlowSystemProp.CLOUDFLARE_API_BASE]: stringValidator,
    [FlowSystemProp.CLOUDFLARE_ZONE_ID]: stringValidator,

    // Secret Manager
    [FlowSystemProp.SECRET_MANAGER_API_KEY]: stringValidator,

    // Tables
    [FlowSystemProp.MAX_RECORDS_PER_TABLE]: numberValidator,
    [FlowSystemProp.MAX_FIELDS_PER_TABLE]: numberValidator,

    // MCP
    [FlowSystemProp.ENABLE_FLOW_ON_PUBLISH]: booleanValidator,
    [FlowSystemProp.ISSUE_ARCHIVE_DAYS]: (value: string) => {
        const days = parseInt(value)
        if (isNaN(days) || days < 0) {
            return 'Value must be a non-negative number'
        }
        return true
    },
}



const validateSystemPropTypes = () => {
    const systemProperties: SystemProp[] = [...Object.values(FlowSystemProp), ...Object.values(FlowSystemProp)]
    const errors: {
        [key in SystemProp]?: string
    } = {}

    for (const prop of systemProperties) {
        const value = system.get(prop)
        const onlyValidateIfValueIsSet = !isNil(value)
        if (onlyValidateIfValueIsSet) {
            const validationResult = systemPropValidators[prop](value)
            if (validationResult !== true) {
                errors[prop] = `Current value: ${value}. Expected: ${validationResult}`
            }
        }
    }
    return errors
}

export const validateEnvPropsOnStartup = async (log: FastifyBaseLogger): Promise<void> => {

    const environment = system.get(FlowSystemProp.ENVIRONMENT)
    const fileStorageLocation = process.env.FLOW_FILE_STORAGE_LOCATION
    
    if (environment !== FlowEnvironment.TESTING && fileStorageLocation === FileLocation.S3) {
        try {
            await s3Helper(log).validateS3Configuration()
        }
        catch (error: unknown) {
            throw new Error(JSON.stringify({
                error: inspect(error),
                message: 'S3 validation failed. Check your configuration and credentials.',
                docUrl: 'https://www.activepieces.com/docs/install/configuration/overview#configure-s3-optional',
            }))
        }
    }

    const errors = validateSystemPropTypes()
    if (Object.keys(errors).length > 0) {
        log.warn({
            errors,
        }, '[validateEnvPropsOnStartup]')
    }

    const codeSandboxType = process.env.FLOW_CODE_SANDBOX_TYPE
    if (!isNil(codeSandboxType)) {
        throw new Error(JSON.stringify({
            message: 'FLOW_CODE_SANDBOX_TYPE is deprecated, please use FLOW_EXECUTION_MODE instead',
            docUrl: 'https://www.activepieces.com/docs/install/configuration/overview',
        }))
    }
    const encryptionKey = await encryptUtils.getEncryptionKey()
    const isValidHexKey = encryptionKey && /^[A-Za-z0-9]{32}$/.test(encryptionKey)
    if (!isValidHexKey) {
        throw new Error(JSON.stringify({
            message: 'FLOW_ENCRYPTION_KEY is missing or invalid. It must be a 32-character hexadecimal string (representing 16 bytes). You can generate one using the command: `openssl rand -hex 16`',
            docUrl: 'https://www.activepieces.com/docs/install/configuration/environment-variables',
        }))
    }
    const isApp = system.isApp()
    if (isApp) {
        const rentionPeriod = system.getNumberOrThrow(FlowSystemProp.EXECUTION_DATA_RETENTION_DAYS)
        const maximumPausedFlowTimeout = system.getNumberOrThrow(FlowSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
        if (maximumPausedFlowTimeout > rentionPeriod) {
            throw new Error(JSON.stringify({
                message: 'FLOW_PAUSED_FLOW_TIMEOUT_DAYS can not exceed FLOW_EXECUTION_DATA_RETENTION_DAYS',
            }))
        }
    }

    const jwtSecret = await jwtUtils.getJwtSecret()
    if (isNil(jwtSecret)) {
        throw new Error(JSON.stringify({
            message: 'FLOW_JWT_SECRET is undefined, please define it in the environment variables',
            docUrl: 'https://www.activepieces.com/docs/install/configuration/environment-variables',
        }))
    }

    const edition = system.getEdition()
    if ([FlowEdition.CLOUD, FlowEdition.ENTERPRISE].includes(edition) && environment === FlowEnvironment.PRODUCTION) {
        const executionMode = system.getOrThrow<ExecutionMode>(FlowSystemProp.EXECUTION_MODE)
        if (![ExecutionMode.SANDBOX_PROCESS, ExecutionMode.SANDBOX_CODE_ONLY, ExecutionMode.SANDBOX_CODE_AND_PROCESS].includes(executionMode)) {
            throw new Error(JSON.stringify({
                message: `Execution mode ${executionMode} is no longer supported in this edition, check the documentation for recent changes`,
                docUrl: 'https://www.activepieces.com/docs/install/configuration/overview',
            }))
        }
    }

    if (environment !== FlowEnvironment.TESTING) {
        await packageManager(log).validate()
        await registryPieceManager(log).validate()
    }
}
