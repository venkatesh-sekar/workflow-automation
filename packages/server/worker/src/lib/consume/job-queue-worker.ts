import { getPlatformQueueName, QueueName } from '@flow/server-common'
import {
    assertNotNullOrUndefined,
    ConsumeJobResponseStatus,
    ExecutionType,
    isNil,
    JOB_PRIORITY,
    JobData,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RATE_LIMIT_PRIORITY,
    WorkerJobType,
} from '@flow/shared'
import { DelayedError, Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../api/server-api.service'
import { workerMachine } from '../utils/machine'
import { workerRedisConnections } from '../utils/worker-redis'
import { jobConsumer } from './job-consumer'

let worker: Worker<JobData>

export const jobQueueWorker = (log: FastifyBaseLogger) => ({
    async start(): Promise<void> {
        if (!isNil(worker)) {
            return
        }
        const isOtpEnabled = workerMachine.getSettings().OTEL_ENABLED
        const queueName = getWorkerQueueName()
        log.info({ queueName }, '[DIAG] Starting BullMQ worker on queue')
        worker = new Worker<JobData>(queueName, async (job, token) => {
            try {
                log.info({ jobId: job.id, jobType: job.data?.jobType }, '[DIAG] Worker received job')

                const deprecatedJobs = ['DELAYED_FLOW']
                if (deprecatedJobs.includes(job.data.jobType)) {
                    log.info({
                        jobId: job.id,
                        jobData: job.data,
                    }, 'Skipping deprecated job')
                    return
                }
                const isOldSchemaVersion = ('schemaVersion' in job.data ? job.data.schemaVersion : 0) !== LATEST_JOB_DATA_SCHEMA_VERSION
                if (isOldSchemaVersion) {
                    const newJobData = await workerApiService().migrateJob({ jobData: job.data }) as JobData
                    await job.updateData(newJobData)
                }

                const jobId = job.id
                assertNotNullOrUndefined(jobId, 'jobId')

                // Rate limiting skipped in inline mode — can add later if needed

                const response = await jobConsumer(log).consumeJob(job)
                log.info({
                    response,
                }, 'Consumed job')
                const isInternalError = response.status === ConsumeJobResponseStatus.INTERNAL_ERROR
                if (isInternalError) {
                    throw new Error(response.errorMessage ?? 'Unknown error')
                }
                const delayInSeconds = response.delayInSeconds
                if (!isNil(delayInSeconds) && job.data.jobType === WorkerJobType.EXECUTE_FLOW) {
                    await job.updateData({
                        ...job.data,
                        executionType: ExecutionType.RESUME,
                    })

                    await job.moveToDelayed(dayjs().add(delayInSeconds, 'seconds').valueOf(), job.token)
                    throw new DelayedError('Job requested to be delayed')
                }
            }
            catch (err) {
                log.error({ err, jobId: job.id, jobType: job.data?.jobType }, '[DIAG] Job execution error')
                throw err
            }
            finally {
                // Rate limiter cleanup skipped in inline mode
            }
        },
        {
            connection: await workerRedisConnections.create(),
            telemetry: isOtpEnabled
                ? new BullMQOtel(QueueName.WORKER_JOBS)
                : undefined,
            concurrency: workerMachine.getSettings().WORKER_CONCURRENCY,
            autorun: true,
            stalledInterval: 30000,
            maxStalledCount: 5,
        },
        )
        await worker.waitUntilReady()
        log.info('Job queue worker started')
    },
    async close(): Promise<void> {
        if (isNil(worker)) {
            return
        }
        await worker.close()
    },
})



function getWorkerQueueName(): string {
    const platformIdForDedicatedWorker = workerMachine.getSettings().PLATFORM_ID_FOR_DEDICATED_WORKER
    if (!isNil(platformIdForDedicatedWorker)) {
        return getPlatformQueueName(platformIdForDedicatedWorker)
    }
    return QueueName.WORKER_JOBS
}
