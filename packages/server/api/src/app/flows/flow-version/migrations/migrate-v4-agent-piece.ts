import { flowStructureUtil, FlowVersion } from '@flow/shared'
import { flowMigrationUtil } from './flow-migration-util'
import { Migration } from '.'

export const migrateAgentPieceV4: Migration = {
    targetSchemaVersion: '4',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowMigrationUtil.pinPieceToVersion(flowVersion, '@flow/piece-agent', '0.2.4')
        const agentIds = flowStructureUtil.extractAgentIds(newVersion)
        return {
            ...newVersion,
            schemaVersion: '5',
            agentIds,
        }
    },
}

