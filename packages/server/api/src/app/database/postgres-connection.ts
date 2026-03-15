import { TlsOptions } from 'node:tls'
import 'pg'
import { AppSystemProp } from '@flow/server-common'
import { isNil, spreadIfDefined } from '@flow/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { InitialSchema1773594074709 } from './migration/postgres/1773594074709-InitialSchema'

const getSslConfig = (): boolean | TlsOptions => {
    const useSsl = system.get(AppSystemProp.POSTGRES_USE_SSL)
    if (useSsl === 'true') {
        return {
            ca: system.get(AppSystemProp.POSTGRES_SSL_CA)?.replace(/\\n/g, '\n'),
        }
    }
    return false
}

export const getMigrations = (): (new () => MigrationInterface)[] => {
    return [
        InitialSchema1773594074709,
    ]
}


export const createPostgresDataSource = (): DataSource => {
    const migrationConfig: MigrationConfig = {
        migrationsRun: true,
        migrationsTransactionMode: 'each',
        migrations: getMigrations(),
        synchronize: false,
    }

    const url = system.get(AppSystemProp.POSTGRES_URL)

    if (!isNil(url)) {
        return new DataSource({
            type: 'postgres',
            url,
            ssl: getSslConfig(),
            ...spreadIfDefined('poolSize', system.get(AppSystemProp.POSTGRES_POOL_SIZE)),
            ...migrationConfig,
            ...commonProperties,
        })
    }

    const database = system.getOrThrow(AppSystemProp.POSTGRES_DATABASE)
    const host = system.getOrThrow(AppSystemProp.POSTGRES_HOST)
    const password = system.getOrThrow(AppSystemProp.POSTGRES_PASSWORD)
    const serializedPort = system.getOrThrow(AppSystemProp.POSTGRES_PORT)
    const port = Number.parseInt(serializedPort, 10)
    const idleTimeoutMillis = system.getNumberOrThrow(AppSystemProp.POSTGRES_IDLE_TIMEOUT_MS)
    const username = system.getOrThrow(AppSystemProp.POSTGRES_USERNAME)

    return new DataSource({
        type: 'postgres',
        host,
        port,
        username,
        password,
        database,
        ssl: getSslConfig(),
        ...spreadIfDefined('poolSize', system.get(AppSystemProp.POSTGRES_POOL_SIZE)),
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
