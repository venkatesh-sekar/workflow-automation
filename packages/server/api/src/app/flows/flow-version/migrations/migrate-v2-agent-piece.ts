import { FlowVersion } from '@flow/shared'
import { flowMigrationUtil } from './flow-migration-util'
import { Migration } from '.'

export const migrateAgentPieceV2: Migration = {
    targetSchemaVersion: '2',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowMigrationUtil.pinPieceToVersion(flowVersion, '@flow/piece-agent', '0.2.0')
        return {
            ...newVersion,
            schemaVersion: '3',
        }
    },
} 