import path from 'path'
import { assertNotNullOrUndefined } from '@flow/shared'
import { environmentMigrations } from './env-migrations'

export const systemConstants = {
    ENGINE_EXECUTABLE_PATH: 'dist/packages/engine/main.js',
}

export type SystemProp = FlowSystemProp | FlowWorkerSystemProp

export enum FlowSystemProp {
    ADMIN_EMAIL = 'ADMIN_EMAIL',
    ADMIN_API_KEY = 'ADMIN_API_KEY',
    API_KEY = 'API_KEY',
    TEMPLATES_API_KEY = 'TEMPLATES_API_KEY',
    API_RATE_LIMIT_AUTHN_ENABLED = 'API_RATE_LIMIT_AUTHN_ENABLED',
    API_RATE_LIMIT_AUTHN_MAX = 'API_RATE_LIMIT_AUTHN_MAX',
    API_RATE_LIMIT_AUTHN_WINDOW = 'API_RATE_LIMIT_AUTHN_WINDOW',
    APP_WEBHOOK_SECRETS = 'APP_WEBHOOK_SECRETS',
    CLIENT_REAL_IP_HEADER = 'CLIENT_REAL_IP_HEADER',
    CLOUD_AUTH_ENABLED = 'CLOUD_AUTH_ENABLED',
    CONFIG_PATH = 'CONFIG_PATH',
    DB_TYPE = 'DB_TYPE',
    EDITION = 'EDITION',
    ENABLE_FLOW_ON_PUBLISH = 'ENABLE_FLOW_ON_PUBLISH',
    ENCRYPTION_KEY = 'ENCRYPTION_KEY',
    ENVIRONMENT = 'ENVIRONMENT',
    EXECUTION_DATA_RETENTION_DAYS = 'EXECUTION_DATA_RETENTION_DAYS',
    EXECUTION_MODE = 'EXECUTION_MODE',
    FILE_STORAGE_LOCATION = 'FILE_STORAGE_LOCATION',
    FLOW_TIMEOUT_SECONDS = 'FLOW_TIMEOUT_SECONDS',
    GOOGLE_CLIENT_ID = 'GOOGLE_CLIENT_ID',
    GOOGLE_CLIENT_SECRET = 'GOOGLE_CLIENT_SECRET',
    HYPERDX_TOKEN = 'HYPERDX_TOKEN',
    INTERNAL_URL = 'INTERNAL_URL',
    ISSUE_ARCHIVE_DAYS = 'ISSUE_ARCHIVE_DAYS',
    JWT_SECRET = 'JWT_SECRET',
    LOG_LEVEL = 'LOG_LEVEL',
    LOG_PRETTY = 'LOG_PRETTY',
    LOKI_PASSWORD = 'LOKI_PASSWORD',
    LOKI_URL = 'LOKI_URL',
    LOKI_USERNAME = 'LOKI_USERNAME',
    MAX_CONCURRENT_JOBS_PER_PROJECT = 'MAX_CONCURRENT_JOBS_PER_PROJECT',
    MAX_FIELDS_PER_TABLE = 'MAX_FIELDS_PER_TABLE',
    MAX_FILE_SIZE_MB = 'MAX_FILE_SIZE_MB',
    MAX_FLOW_RUN_LOG_SIZE_MB = 'MAX_FLOW_RUN_LOG_SIZE_MB',
    MAX_RECORDS_PER_TABLE = 'MAX_RECORDS_PER_TABLE',
    OTEL_ENABLED = 'OTEL_ENABLED',
    PAUSED_FLOW_TIMEOUT_DAYS = 'PAUSED_FLOW_TIMEOUT_DAYS',
    PIECES_CACHE_MAX_ENTRIES = 'PIECES_CACHE_MAX_ENTRIES',
    PM2_ENABLED = 'PM2_ENABLED',
    POSTGRES_DATABASE = 'POSTGRES_DATABASE',
    POSTGRES_HOST = 'POSTGRES_HOST',
    POSTGRES_IDLE_TIMEOUT_MS = 'POSTGRES_IDLE_TIMEOUT_MS',
    POSTGRES_PASSWORD = 'POSTGRES_PASSWORD',
    POSTGRES_POOL_SIZE = 'POSTGRES_POOL_SIZE',
    POSTGRES_PORT = 'POSTGRES_PORT',
    POSTGRES_SSL_CA = 'POSTGRES_SSL_CA',
    POSTGRES_URL = 'POSTGRES_URL',
    POSTGRES_USERNAME = 'POSTGRES_USERNAME',
    POSTGRES_USE_SSL = 'POSTGRES_USE_SSL',
    PROJECT_RATE_LIMITER_ENABLED = 'PROJECT_RATE_LIMITER_ENABLED',
    QUEUE_UI_ENABLED = 'QUEUE_UI_ENABLED',
    QUEUE_UI_PASSWORD = 'QUEUE_UI_PASSWORD',
    QUEUE_UI_USERNAME = 'QUEUE_UI_USERNAME',
    REDIS_DB = 'REDIS_DB',
    REDIS_FAILED_JOB_RETENTION_DAYS = 'REDIS_FAILED_JOB_RETENTION_DAYS',
    REDIS_FAILED_JOB_RETENTION_MAX_COUNT = 'REDIS_FAILED_JOB_RETENTION_MAX_COUNT',
    REDIS_HOST = 'REDIS_HOST',
    REDIS_PASSWORD = 'REDIS_PASSWORD',
    REDIS_PORT = 'REDIS_PORT',
    REDIS_SENTINEL_HOSTS = 'REDIS_SENTINEL_HOSTS',
    REDIS_SENTINEL_NAME = 'REDIS_SENTINEL_NAME',
    REDIS_SENTINEL_ROLE = 'REDIS_SENTINEL_ROLE',
    REDIS_SSL_CA_FILE = 'REDIS_SSL_CA_FILE',
    REDIS_TYPE = 'REDIS_TYPE',
    REDIS_URL = 'REDIS_URL',
    REDIS_USER = 'REDIS_USER',
    REDIS_USE_SSL = 'REDIS_USE_SSL',
    RUNS_METADATA_UPDATE_CONCURRENCY = 'RUNS_METADATA_UPDATE_CONCURRENCY',
    S3_ACCESS_KEY_ID = 'S3_ACCESS_KEY_ID',
    S3_BUCKET = 'S3_BUCKET',
    S3_ENDPOINT = 'S3_ENDPOINT',
    S3_REGION = 'S3_REGION',
    S3_SECRET_ACCESS_KEY = 'S3_SECRET_ACCESS_KEY',
    S3_USE_IRSA = 'S3_USE_IRSA',
    S3_USE_SIGNED_URLS = 'S3_USE_SIGNED_URLS',
    SANDBOX_MEMORY_LIMIT = 'SANDBOX_MEMORY_LIMIT',
    SANDBOX_PROPAGATED_ENV_VARS = 'SANDBOX_PROPAGATED_ENV_VARS',
    SECRET_MANAGER_API_KEY = 'SECRET_MANAGER_API_KEY',
    SKIP_PROJECT_LIMITS_CHECK = 'SKIP_PROJECT_LIMITS_CHECK',
    SMTP_HOST = 'SMTP_HOST',
    SMTP_PASSWORD = 'SMTP_PASSWORD',
    SMTP_PORT = 'SMTP_PORT',
    SMTP_SENDER_EMAIL = 'SMTP_SENDER_EMAIL',
    SMTP_SENDER_NAME = 'SMTP_SENDER_NAME',
    SMTP_USERNAME = 'SMTP_USERNAME',
    TRIGGER_DEFAULT_POLL_INTERVAL = 'TRIGGER_DEFAULT_POLL_INTERVAL',
    TRIGGER_HOOKS_TIMEOUT_SECONDS = 'TRIGGER_HOOKS_TIMEOUT_SECONDS',
    TRIGGER_TIMEOUT_SECONDS = 'TRIGGER_TIMEOUT_SECONDS',
    WEBHOOK_TIMEOUT_SECONDS = 'WEBHOOK_TIMEOUT_SECONDS',

    EVENT_DESTINATION_TIMEOUT_SECONDS = 'EVENT_DESTINATION_TIMEOUT_SECONDS',
    VAULT_ADDR = 'VAULT_ADDR',
    VAULT_USERNAME = 'VAULT_USERNAME',
    VAULT_PASSWORD = 'VAULT_PASSWORD',
    VAULT_MOUNT = 'VAULT_MOUNT',
}

export enum ContainerType {
    WORKER = 'WORKER',
    APP = 'APP',
    WORKER_AND_APP = 'WORKER_AND_APP',
}

export enum FlowWorkerSystemProp {
    WORKER_TOKEN = 'WORKER_TOKEN',
    CONTAINER_TYPE = 'CONTAINER_TYPE',
    FRONTEND_URL = 'FRONTEND_URL',

    // Optional
    WORKER_CONCURRENCY = 'WORKER_CONCURRENCY',
    PLATFORM_ID_FOR_DEDICATED_WORKER = 'PLATFORM_ID_FOR_DEDICATED_WORKER',
    PRE_WARM_CACHE = 'PRE_WARM_CACHE',
}


export const environmentVariables = {
    hasAppModules(): boolean {
        const environment = this.getEnvironment(FlowWorkerSystemProp.CONTAINER_TYPE) ?? ContainerType.WORKER_AND_APP
        return [ContainerType.APP, ContainerType.WORKER_AND_APP].includes(environment as ContainerType)
    },
    getNumberEnvironment: (prop: FlowWorkerSystemProp | FlowSystemProp): number | undefined => {
        const value = environmentVariables.getEnvironment(prop)
        return value ? parseInt(value) : undefined
    },
    getBooleanEnvironment: (prop: FlowWorkerSystemProp | FlowSystemProp): boolean | undefined => {
        const value = environmentVariables.getEnvironment(prop)
        return value ? value === 'true' : undefined
    },
    getEnvironment: (prop: FlowWorkerSystemProp | FlowSystemProp): string | undefined => {
        const environmnetVariables = environmentMigrations.migrate()
        return environmnetVariables['FLOW_' + prop]
    },
    getEnvironmentOrThrow: (prop: FlowWorkerSystemProp | FlowSystemProp): string => {
        const value = environmentVariables.getEnvironment(prop)
        assertNotNullOrUndefined(value, `Environment variable ${prop} is not set`)
        return value
    },
}

export const apVersionUtil = {
    async getCurrentRelease(): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const packageJson = require(path.resolve(process.cwd(), 'package.json'))
        return packageJson.version
    },
    async getLatestRelease(): Promise<string> {
        return apVersionUtil.getCurrentRelease()
    },
}
