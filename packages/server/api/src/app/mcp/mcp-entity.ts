import { McpServer, Project } from '@flow/shared'
import { EntitySchema } from 'typeorm'
import { FlowIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type McpServerWithSchema = McpServer & {  
    project: Project
}

export const McpServerEntity = new EntitySchema<McpServerWithSchema>({
    name: 'mcp_server',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: FlowIdSchema,
        status: {
            type: String,
            nullable: false,
        },
        token: {
            type: String,
            nullable: false,
        },
        enabledTools: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'mcp_server_project_id',
            columns: ['projectId'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
            },
        },
    },
    
})

