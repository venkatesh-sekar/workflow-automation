import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../database/database-common'

export type AuditEventSchema = {
    id: string
    created: string
    updated: string
    projectId: string
    userId: string
    event: string
    data: Record<string, unknown>
    project: unknown
    user: unknown
}

export const AuditEventEntity = new EntitySchema<AuditEventSchema>({
    name: 'audit_event',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            type: String,
            nullable: false,
        },
        userId: {
            type: String,
            nullable: false,
        },
        event: {
            type: String,
            nullable: false,
        },
        data: {
            type: 'jsonb',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_audit_event_project_id',
            columns: ['projectId'],
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_audit_event_project_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_audit_event_user_id',
            },
        },
    },
})
