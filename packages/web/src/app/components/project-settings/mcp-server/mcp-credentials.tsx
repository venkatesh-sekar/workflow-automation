import { FlowFlagId, Permission, PopulatedMcpServer } from '@flow/shared';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { ButtonWithTooltip } from '@/components/custom/button-with-tooltip';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Badge } from '@/components/ui/badge';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { mcpHooks } from './utils/mcp-hooks';

export function McpCredentials({ mcpServer }: McpCredentialsProps) {
  const [showToken, setShowToken] = useState(false);
  const toggleTokenVisibility = () => setShowToken(!showToken);
  const currentProjectId = authenticationSession.getProjectId();

  const { checkAccess } = useAuthorization();
  const { mutate: rotateToken, isPending: isRotating } =
    mcpHooks.useRotateMcpToken(currentProjectId!);

  const { data: publicUrl } = flagsHooks.useFlag<string>(FlowFlagId.PUBLIC_URL);
  const baseUrl = publicUrl?.replace(/\/$/, '') ?? '';
  const serverUrl = `${baseUrl}/api/v1/projects/${currentProjectId}/mcp-server/http`;

  const maskToken = (tokenValue: string) => {
    if (tokenValue.length <= 8) return '••••••••';
    return '••••••••' + tokenValue.slice(-4);
  };

  const jsonConfiguration = {
    mcpServers: {
      flow: {
        url: serverUrl,
        headers: {
          Authorization: `Bearer ${mcpServer?.token ?? ''}`,
        },
      },
    },
  };

  const claudeDesktopConfiguration = {
    mcpServers: {
      flow: {
        command: 'npx',
        args: [
          '-y',
          'mcp-remote',
          serverUrl,
          '--header',
          `Authorization: Bearer ${mcpServer?.token ?? 'YOUR_TOKEN'}`,
        ],
      },
    },
  };

  const remote_mcp_server_url = `${serverUrl}?token=${encodeURIComponent(
    mcpServer?.token ?? '',
  )}`;

  const customConnectorConfiguration = {
    remote_mcp_server_url,
  };

  return (
    <div className="space-y-4">
      {/* Base URL Field */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {'Server URL'}
        </label>
        <div className="flex items-center gap-2">
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm flex-1 overflow-x-auto">
            {serverUrl}
          </div>
          <CopyButton textToCopy={serverUrl} />
        </div>
      </div>

      {/* Token Field */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {'Token'}
        </label>
        <div className="flex items-center gap-2">
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm flex-1 overflow-x-auto">
            {showToken ? mcpServer?.token : maskToken(mcpServer?.token ?? '')}
          </div>
          <ButtonWithTooltip
            className="h-9 w-9"
            tooltip={
              showToken ? 'Hide sensitive data' : 'Show sensitive data'
            }
            onClick={toggleTokenVisibility}
            variant="outline"
            icon={
              showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )
            }
          />
          <ButtonWithTooltip
            tooltip={'Create a new token. The current one will stop working.'}
            onClick={() => rotateToken()}
            variant="outline"
            className="h-9 w-9"
            disabled={isRotating || !mcpServer?.status}
            hasPermission={checkAccess(Permission.WRITE_MCP)}
            icon={
              isRotating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )
            }
          />
          <CopyButton textToCopy={mcpServer?.token ?? ''} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {'Use this token with the Authorization header (Bearer) for requests to this server.'}
        </p>
      </div>

      {/* JSON Configuration (Cursor / URL + headers) */}
      <CollapsibleJson
        json={jsonConfiguration}
        label={'MCP Client Configuration (JSON)'}
        description={'Copy to your MCP client (e.g. Cursor) if it supports url + headers. Use the Server URL above; it must end with /http (not /sse).'}
        defaultOpen={false}
      />

      {/* Claude Desktop (mcp-remote) */}
      <CollapsibleJson
        json={claudeDesktopConfiguration}
        label={'Claude Desktop (mcp-remote)'}
        description={'Copy into your Claude Desktop config file (e.g. claude_desktop_config.json).'}
        defaultOpen={false}
      />

      {/* Custom Connector (no custom headers) */}
      <CollapsibleJson
        json={customConnectorConfiguration}
        label={
          <span className="flex items-center gap-2">
            {'Claude Custom Connector'}
            <Badge variant="outline" className="text-xs">
              {'Beta'}
            </Badge>
          </span>
        }
        description={"Only use connectors from developers you trust. The platform does not control which tools developers make available and cannot verify that they will work as intended or that they won't change."}
        defaultOpen={false}
      />
    </div>
  );
}

type McpCredentialsProps = {
  mcpServer: PopulatedMcpServer;
};
