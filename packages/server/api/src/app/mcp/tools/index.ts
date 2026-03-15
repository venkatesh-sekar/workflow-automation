import { McpServer, McpToolDefinition } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'
import { apAddBranchTool } from './flow-add-branch'
import { apAddStepTool } from './flow-add-step'
import { apChangeFlowStatusTool } from './flow-change-flow-status'
import { apCreateFlowTool } from './flow-create-flow'
import { apDeleteBranchTool } from './flow-delete-branch'
import { apDeleteStepTool } from './flow-delete-step'
import { apFlowStructureTool } from './flow-flow-structure'
import { apListConnectionsTool } from './flow-list-connections'
import { apListFlowsTool } from './flow-list-flows'
import { apListPiecesTool } from './flow-list-pieces'
import { apLockAndPublishTool } from './flow-lock-and-publish'
import { apManageNotesTool } from './flow-manage-notes'
import { apRenameFlowTool } from './flow-rename-flow'
import { apUpdateStepTool } from './flow-update-step'
import { apUpdateTriggerTool } from './flow-update-trigger'

export const LOCKED_TOOL_NAMES: string[] = [
    'ap_list_flows',
    'ap_flow_structure',
    'ap_list_pieces',
    'ap_list_connections',
]

// NOTE: Keep this list in sync with TOOL_CATEGORIES in
// packages/web/src/app/components/project-settings/mcp-server/utils/mcp-tools-metadata.ts
// Any tool added here must also be added there so it appears in the UI settings panel.
export const ALL_CONTROLLABLE_TOOL_NAMES: string[] = [
    'ap_create_flow',
    'ap_rename_flow',
    'ap_update_trigger',
    'ap_add_step',
    'ap_update_step',
    'ap_delete_step',
    'ap_add_branch',
    'ap_delete_branch',
    'ap_lock_and_publish',
    'ap_change_flow_status',
    'ap_manage_notes',
]

export const flowTools = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition[] => [
    apCreateFlowTool(mcp, log),
    apRenameFlowTool(mcp, log),
    apListFlowsTool(mcp, log),
    apFlowStructureTool(mcp, log),
    apListPiecesTool(mcp, log),
    apListConnectionsTool(mcp, log),
    apUpdateTriggerTool(mcp, log),
    apAddStepTool(mcp, log),
    apUpdateStepTool(mcp, log),
    apDeleteStepTool(mcp, log),
    apAddBranchTool(mcp, log),
    apDeleteBranchTool(mcp, log),
    apLockAndPublishTool(mcp, log),
    apChangeFlowStatusTool(mcp, log),
    apManageNotesTool(mcp, log),
]
