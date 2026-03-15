import {
  AgentMcpTool,
  ValidateAgentMcpToolResponse,
} from '@flow/shared';

import { api } from '@/lib/api';

export const mcpToolApi = {
  async validateAgentMcpTool(
    projectId: string,
    request: AgentMcpTool,
  ): Promise<ValidateAgentMcpToolResponse> {
    return await api.post<ValidateAgentMcpToolResponse>(
      `/v1/projects/${projectId}/mcp-server/validate-agent-mcp-tool`,
      request,
    );
  },
};
