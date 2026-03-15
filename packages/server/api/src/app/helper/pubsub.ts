import { pubsubFactory } from '@flow/server-common'
import { redisConnections } from '../database/redis-connections'

export const pubsub = pubsubFactory(redisConnections.create)
