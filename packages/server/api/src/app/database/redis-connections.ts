import {
    FlowSystemProp,
    distributedLockFactory,
    distributedStoreFactory,
    redisConnectionFactory,
    RedisType,
} from '@flow/server-common'
import { system } from '../helper/system/system'

export const redisConnections: ReturnType<typeof redisConnectionFactory> = redisConnectionFactory(() => {
    return {
        REDIS_TYPE: system.getOrThrow<RedisType>(FlowSystemProp.REDIS_TYPE),
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
    }
})

export const distributedLock = distributedLockFactory(redisConnections.create)
export const distributedStore = distributedStoreFactory(redisConnections.useExisting)
