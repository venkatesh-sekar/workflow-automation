import { WorkerSystemProp } from '@flow/server-common'
import { isNil } from '@flow/shared'
import { FastifyInstance } from 'fastify'
import { flowWorker } from 'worker'
import { accessTokenManager } from './authentication/lib/access-token-manager'
import { healthStatusService } from './health/health.service'
import { system } from './helper/system/system'

export const setupWorker = async (app: FastifyInstance): Promise<void> => {
    app.addHook('onClose', async () => {
        await flowWorker(app.log).close()
    })
}

export async function workerPostBoot(app: FastifyInstance): Promise<void> {
    const workerToken = await generateWorkerToken(app)
    await flowWorker(app.log).init({ workerToken, markAsHealthy: async () => healthStatusService(app.log).markWorkerHealthy() })
}



async function generateWorkerToken(app: FastifyInstance): Promise<string> {
    const workerToken = system.get(WorkerSystemProp.WORKER_TOKEN)
    if (!isNil(workerToken)) {
        return workerToken
    }
    return accessTokenManager(app.log).generateWorkerToken()
}