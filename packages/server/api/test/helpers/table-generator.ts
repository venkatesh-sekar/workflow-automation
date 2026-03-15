import { flowId, Field, FieldState, FieldType, PopulatedTable, TableAutomationStatus } from '@flow/shared'
import { faker } from '@faker-js/faker'

export const tableGenerator = {
    simpleTable(table: Partial<PopulatedTable>): PopulatedTable {
        const tableId = flowId()
        return {
            id: tableId,
            name: faker.lorem.word(),
            externalId: table.externalId ?? flowId(),
            fields: table.fields ?? [
                tableGenerator.generateRandomField(tableId),
                tableGenerator.generateRandomField(tableId),
            ],
            projectId: flowId(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
            status: table.status ?? TableAutomationStatus.ENABLED,
            trigger: table.trigger ?? null,
        }
    },
    generateRandomField(tableId: string): Field {
        return {
            id: flowId(),
            projectId: flowId(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
            tableId,
            name: faker.lorem.word(),
            type: FieldType.TEXT,
            externalId: flowId(),
        }
    },
    generateRandomDropdownField(): FieldState {
        return {
            name: faker.lorem.word(),
            type: FieldType.STATIC_DROPDOWN,
            externalId: flowId(),
            data: {
                options: [
                    { value: faker.lorem.word() },
                    { value: faker.lorem.word() },
                ],
            },
        }
    },
} 