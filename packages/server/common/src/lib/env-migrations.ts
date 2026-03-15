import { ExecutionMode } from '@flow/shared'
import { RedisType } from './redis/types'
import { FlowSystemProp } from './system-props'

const envPrefix = (prop: string): string => `FLOW_${prop}`

export const environmentMigrations = {
    migrate(): Record<string, string | undefined> {

        return {
            ...process.env,
            [envPrefix(FlowSystemProp.EXECUTION_MODE)]: migrateExecutionMode(getRawValue(FlowSystemProp.EXECUTION_MODE)),
            [envPrefix(FlowSystemProp.REDIS_TYPE)]: migrateRedisType(getRawValue(FlowSystemProp.REDIS_TYPE)),
        }
    },
}

function migrateRedisType(currentRedisType: string | undefined): string | undefined {
    const queueMode = process.env['FLOW_QUEUE_MODE']
    if (queueMode === 'MEMORY') {
        return RedisType.MEMORY
    }
    return currentRedisType
}

function migrateExecutionMode(currentExecutionMode: string | undefined): string | undefined {
    if (currentExecutionMode === 'SANDBOXED') {
        return ExecutionMode.SANDBOX_PROCESS
    }
    return currentExecutionMode
}

function getRawValue(prop: string): string | undefined {
    return process.env[envPrefix(prop)]
}
