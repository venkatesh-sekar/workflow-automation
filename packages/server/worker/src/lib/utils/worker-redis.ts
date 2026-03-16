/**
 * Redis connections for the worker package.
 * In our inline model, we reuse the API's redis connections
 * rather than creating separate ones.
 */
import {
    FlowSystemProp,
    distributedLockFactory,
    distributedStoreFactory,
    redisConnectionFactory,
    RedisType,
} from '@flow/server-common'
import { workerMachine } from './machine'

export const workerRedisConnections = redisConnectionFactory(() => {
    const settings = workerMachine.getSettings()
    const {
        REDIS_TYPE,
        REDIS_SSL_CA_FILE,
        REDIS_DB,
        REDIS_HOST,
        REDIS_PASSWORD,
        REDIS_PORT,
        REDIS_URL,
        REDIS_USER,
        REDIS_USE_SSL,
        REDIS_SENTINEL_ROLE,
        REDIS_SENTINEL_HOSTS,
        REDIS_SENTINEL_NAME,
    } = settings

    return {
        REDIS_TYPE: REDIS_TYPE as RedisType,
        REDIS_SSL_CA_FILE,
        REDIS_DB: REDIS_DB ?? undefined,
        REDIS_HOST,
        REDIS_PASSWORD,
        REDIS_PORT,
        REDIS_URL,
        REDIS_USER,
        REDIS_USE_SSL,
        REDIS_SENTINEL_ROLE,
        REDIS_SENTINEL_HOSTS,
        REDIS_SENTINEL_NAME,
    }
})

export const workerDistributedLock = distributedLockFactory(workerRedisConnections.create)
export const workerDistributedStore = distributedStoreFactory(workerRedisConnections.useExisting)
