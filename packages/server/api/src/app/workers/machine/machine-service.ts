import { FlowSystemProp, WorkerSystemProp } from '@flow/server-common'
import {
    ExecutionMode,
    isNil,
    partition,
    WebsocketServerEvent,
    WorkerMachineHealthcheckRequest,
    WorkerMachineStatus,
    WorkerMachineWithStatus,
    WorkerSettingsResponse,
} from '@flow/shared'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FastifyBaseLogger } from 'fastify'
import { websocketService } from '../../core/websockets.service'
import { redisConnections } from '../../database/redis-connections'
import { domainHelper } from '../../helper/domain-helper'
import { jwtUtils } from '../../helper/jwt-utils'
import { system } from '../../helper/system/system'
import { workerMachineCache } from './machine-cache'

dayjs.extend(utc)

export const machineService = (log: FastifyBaseLogger) => {
    return {
        async onDisconnect(request: OnDisconnectParams): Promise<void> {
            log.info({
                message: 'Worker disconnected',
                workerId: request.workerId,
            })
            await workerMachineCache().delete([request.workerId])
        },
        async onConnection(request: WorkerMachineHealthcheckRequest, platformIdForDedicatedWorker?: string | undefined): Promise<WorkerSettingsResponse> {
            await workerMachineCache().upsert({
                id: request.workerId,
                information: request,
            })
            const executionMode = await getExecutionMode(log, platformIdForDedicatedWorker)
            const isDedicatedWorker = !isNil(platformIdForDedicatedWorker)
            return {
                JWT_SECRET: await jwtUtils.getJwtSecret(),
                TRIGGER_TIMEOUT_SECONDS: system.getNumberOrThrow(FlowSystemProp.TRIGGER_TIMEOUT_SECONDS),
                PAUSED_FLOW_TIMEOUT_DAYS: system.getNumberOrThrow(FlowSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
                EXECUTION_MODE: executionMode,
                TRIGGER_HOOKS_TIMEOUT_SECONDS: system.getNumberOrThrow(FlowSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS),
                FLOW_TIMEOUT_SECONDS: system.getNumberOrThrow(FlowSystemProp.FLOW_TIMEOUT_SECONDS),
                WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.WORKER_CONCURRENCY),
                LOG_LEVEL: system.getOrThrow(FlowSystemProp.LOG_LEVEL),
                LOG_PRETTY: system.getOrThrow(FlowSystemProp.LOG_PRETTY),
                ENVIRONMENT: system.getOrThrow(FlowSystemProp.ENVIRONMENT),
                APP_WEBHOOK_SECRETS: system.getOrThrow(FlowSystemProp.APP_WEBHOOK_SECRETS),
                MAX_FLOW_RUN_LOG_SIZE_MB: system.getNumberOrThrow(FlowSystemProp.MAX_FLOW_RUN_LOG_SIZE_MB),
                MAX_FILE_SIZE_MB: system.getNumberOrThrow(FlowSystemProp.MAX_FILE_SIZE_MB),
                SANDBOX_MEMORY_LIMIT: system.getOrThrow(FlowSystemProp.SANDBOX_MEMORY_LIMIT),
                SANDBOX_PROPAGATED_ENV_VARS: system.get(FlowSystemProp.SANDBOX_PROPAGATED_ENV_VARS)?.split(',').map(f => f.trim()) ?? [],
                SENTRY_DSN: system.get(FlowSystemProp.SENTRY_DSN),
                LOKI_PASSWORD: system.get(FlowSystemProp.LOKI_PASSWORD),
                LOKI_URL: system.get(FlowSystemProp.LOKI_URL),
                LOKI_USERNAME: system.get(FlowSystemProp.LOKI_USERNAME),
                OTEL_ENABLED: system.get(FlowSystemProp.OTEL_ENABLED) === 'true',
                PUBLIC_URL: await domainHelper.getPublicUrl({
                    path: '',
                }),
                PROJECT_RATE_LIMITER_ENABLED: isDedicatedWorker ? false : system.getBooleanOrThrow(FlowSystemProp.PROJECT_RATE_LIMITER_ENABLED),
                MAX_CONCURRENT_JOBS_PER_PROJECT: system.getNumberOrThrow(FlowSystemProp.MAX_CONCURRENT_JOBS_PER_PROJECT),
                FILE_STORAGE_LOCATION: system.getOrThrow(FlowSystemProp.FILE_STORAGE_LOCATION),
                S3_USE_SIGNED_URLS: system.getOrThrow(FlowSystemProp.S3_USE_SIGNED_URLS),
                REDIS_TYPE: redisConnections.getRedisType(),
                REDIS_SSL_CA_FILE: system.get(FlowSystemProp.REDIS_SSL_CA_FILE),
                REDIS_DB: system.getNumber(FlowSystemProp.REDIS_DB) ?? undefined,
                REDIS_HOST: system.get(FlowSystemProp.REDIS_HOST),
                REDIS_PASSWORD: system.get(FlowSystemProp.REDIS_PASSWORD),
                REDIS_PORT: system.get(FlowSystemProp.REDIS_PORT),
                REDIS_URL: system.get(FlowSystemProp.REDIS_URL),
                REDIS_USER: system.get(FlowSystemProp.REDIS_USER),
                REDIS_USE_SSL: system.get(FlowSystemProp.REDIS_USE_SSL) === 'true',
                REDIS_SENTINEL_ROLE: system.get(FlowSystemProp.REDIS_SENTINEL_ROLE),
                REDIS_SENTINEL_HOSTS: system.get(FlowSystemProp.REDIS_SENTINEL_HOSTS),
                REDIS_SENTINEL_NAME: system.get(FlowSystemProp.REDIS_SENTINEL_NAME),
                EVENT_DESTINATION_TIMEOUT_SECONDS: system.getNumberOrThrow(FlowSystemProp.EVENT_DESTINATION_TIMEOUT_SECONDS),
                REDIS_FAILED_JOB_RETENTION_DAYS: system.getNumberOrThrow(FlowSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS),
                REDIS_FAILED_JOB_RETENTION_MAX_COUNT: system.getNumberOrThrow(FlowSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT),
                EDITION: system.getOrThrow(FlowSystemProp.EDITION),
            }
        },
        async list(): Promise<WorkerMachineWithStatus[]> {

            let allWorkers = await workerMachineCache().find()

            await Promise.all(allWorkers.map(async worker => {
                const settings = await websocketService.emitWithAck<WorkerMachineHealthcheckRequest[]>( WebsocketServerEvent.WORKER_HEALTHCHECK, worker.id)
                    .catch(error => {
                        log.error({
                            message: 'Failed to get worker healthcheck',
                            error,
                            workerId: worker.id,
                        })
                    })
                if (settings && settings[0]) {
                    await workerMachineCache().upsert({
                        id: worker.id,
                        information: settings[0],
                    })
                }
            }))

            allWorkers = await workerMachineCache().find()

            const offlineThreshold = dayjs().subtract(60, 'seconds').utc()

            const [onlineWorkers, offLineWorkers] = partition(allWorkers, (worker) => dayjs(worker.updated).isAfter(offlineThreshold))

            await workerMachineCache().delete(offLineWorkers.map(worker => worker.id))

            return onlineWorkers.map(worker => ({
                ...worker,
                status: WorkerMachineStatus.ONLINE,
            }))
        },
    }
}


async function getExecutionMode(_log: FastifyBaseLogger, _platformIdForDedicatedWorker: string | undefined): Promise<ExecutionMode> {
    // Community edition: no dedicated workers, always use system config
    return system.getOrThrow<ExecutionMode>(FlowSystemProp.EXECUTION_MODE)
}

type OnDisconnectParams = {
    workerId: string
}