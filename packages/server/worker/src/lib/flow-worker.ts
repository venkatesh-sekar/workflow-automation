/**
 * Main worker lifecycle for inline (same-process) execution.
 *
 * Upstream: creates sandbox pool, connects appSocket, starts job queue.
 * Our adaptation: no sandbox pool, no appSocket. Uses API's Redis connections
 * and reads settings via machineService (same process).
 */
import { rejectedPromiseHandler, RunsMetadataQueueConfig, runsMetadataQueueFactory } from '@flow/server-common'
import { FastifyBaseLogger } from 'fastify'
import { jobQueueWorker } from './consume/job-queue-worker'
import { workerMachine } from './utils/machine'
import { workerDistributedLock, workerDistributedStore, workerRedisConnections } from './utils/worker-redis'

export const runsMetadataQueue = runsMetadataQueueFactory({
    createRedisConnection: workerRedisConnections.create,
    distributedStore: workerDistributedStore,
})

export const flowWorker = (log: FastifyBaseLogger) => ({
    async init({ workerToken: token, markAsHealthy }: FlowWorkerInitParams): Promise<void> {
        log.info('[DIAG] flowWorker.init() called')
        // In inline mode, settings come from the API's machineService.
        // We import it lazily to avoid circular dependencies at module level.
        const { machineService } = await import('../../../api/src/app/workers/machine/machine-service')

        // Build worker settings from system properties (same process)
        const settings = await machineService(log).onConnection({
            cpuUsagePercentage: 0,
            diskInfo: { total: 0, free: 0, used: 0, percentage: 0 },
            workerId: workerMachine.getWorkerId(),
            workerProps: {},
            ramUsagePercentage: 0,
            totalAvailableRamInBytes: 0,
            totalCpuCores: 0,
            ip: '127.0.0.1',
            totalSandboxes: 0,
            freeSandboxes: 0,
        })

        log.info({ redisType: settings.REDIS_TYPE }, '[DIAG] workerMachine settings received')
        await workerMachine.init(settings, token, log)
        log.info('[DIAG] workerMachine initialized, starting job queue worker...')
        await jobQueueWorker(log).start()
        log.info('[DIAG] job queue worker started, initializing runs metadata queue...')
        await initRunsMetadataQueue(log)
        await markAsHealthy()
        log.info('[DIAG] flowWorker.init() complete')
    },

    async close(): Promise<void> {
        if (runsMetadataQueue.isInitialized()) {
            await runsMetadataQueue.get().close()
        }

        await workerRedisConnections.destroy()
        await workerDistributedLock(log).destroy()

        await jobQueueWorker(log).close()
    },
})

async function initRunsMetadataQueue(log: FastifyBaseLogger): Promise<void> {
    const settings = workerMachine.getSettings()
    const config: RunsMetadataQueueConfig = {
        isOtelEnabled: settings.OTEL_ENABLED ?? false,
        redisFailedJobRetentionDays: settings.REDIS_FAILED_JOB_RETENTION_DAYS,
        redisFailedJobRetentionMaxCount: settings.REDIS_FAILED_JOB_RETENTION_MAX_COUNT,
    }
    await runsMetadataQueue.init(config)
    log.info({
        message: 'Initialized runs metadata queue for worker',
    }, '[flowWorker#init]')
}

type FlowWorkerInitParams = {
    workerToken: string
    markAsHealthy: () => Promise<void>
}
