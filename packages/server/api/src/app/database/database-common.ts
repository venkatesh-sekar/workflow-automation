import { FlowSystemProp } from '@flow/server-common'
import { FlowEdition } from '@flow/shared'
import { EntitySchemaColumnOptions } from 'typeorm'
import { system } from '../helper/system/system'

export const COLLATION = 'en_natural'

export const FlowIdSchema = {
    type: String,
    length: 21,
} as EntitySchemaColumnOptions

export const BaseColumnSchemaPart = {
    id: {
        ...FlowIdSchema,
        primary: true,
    } as EntitySchemaColumnOptions,
    created: {
        name: 'created',
        type: 'timestamp with time zone',
        createDate: true,
    } as EntitySchemaColumnOptions,
    updated: {
        name: 'updated',
        type: 'timestamp with time zone',
        updateDate: true,
    } as EntitySchemaColumnOptions,
}

export function isNotOneOfTheseEditions(editions: FlowEdition[]): boolean {
    return !editions.includes(system.getEdition())
}
