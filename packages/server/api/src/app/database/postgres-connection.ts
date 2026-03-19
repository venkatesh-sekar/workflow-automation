import { TlsOptions } from 'node:tls'
import 'pg'
import { FlowSystemProp } from '@flow/server-common'
import { isNil, spreadIfDefined } from '@flow/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { InitialSchema1773594074709 } from './migration/postgres/1773594074709-InitialSchema'
import { RemoveAppConnectionValueColumn1774022400000 } from './migration/postgres/1774022400000-RemoveAppConnectionValueColumn'

const getSslConfig = (): boolean | TlsOptions => {
    const useSsl = system.get(FlowSystemProp.POSTGRES_USE_SSL)
    if (useSsl === 'true') {
        return {
            ca: system.get(FlowSystemProp.POSTGRES_SSL_CA)?.replace(/\\n/g, '\n'),
        }
    }
    return false
}

export const getMigrations = (): (new () => MigrationInterface)[] => {
    return [
        InitialSchema1773594074709,
        RemoveAppConnectionValueColumn1774022400000,
    ]
}


export const createPostgresDataSource = (): DataSource => {
    const migrationConfig: MigrationConfig = {
        migrationsRun: true,
        migrationsTransactionMode: 'each',
        migrations: getMigrations(),
        synchronize: false,
    }

    const url = system.get(FlowSystemProp.POSTGRES_URL)

    if (!isNil(url)) {
        return new DataSource({
            type: 'postgres',
            url,
            ssl: getSslConfig(),
            ...spreadIfDefined('poolSize', system.get(FlowSystemProp.POSTGRES_POOL_SIZE)),
            ...migrationConfig,
            ...commonProperties,
        })
    }

    const database = system.getOrThrow(FlowSystemProp.POSTGRES_DATABASE)
    const host = system.getOrThrow(FlowSystemProp.POSTGRES_HOST)
    const password = system.getOrThrow(FlowSystemProp.POSTGRES_PASSWORD)
    const serializedPort = system.getOrThrow(FlowSystemProp.POSTGRES_PORT)
    const port = Number.parseInt(serializedPort, 10)
    const idleTimeoutMillis = system.getNumberOrThrow(FlowSystemProp.POSTGRES_IDLE_TIMEOUT_MS)
    const username = system.getOrThrow(FlowSystemProp.POSTGRES_USERNAME)

    return new DataSource({
        type: 'postgres',
        host,
        port,
        username,
        password,
        database,
        ssl: getSslConfig(),
        ...spreadIfDefined('poolSize', system.get(FlowSystemProp.POSTGRES_POOL_SIZE)),
        ...commonProperties,
        ...migrationConfig,
        extra: {
            idleTimeoutMillis,
        },
    })
}

type MigrationConfig = {
    migrationsRun?: boolean
    migrationsTransactionMode?: 'all' | 'none' | 'each'
    migrations?: (new () => MigrationInterface)[]
    synchronize: false
}
