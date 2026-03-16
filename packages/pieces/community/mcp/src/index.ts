import { createPiece, PieceAuth } from "@flow/pieces-framework";
import { replyToMcpClient } from "./lib/actions/reply-to-mcp-client";
import { mcpTool } from "./lib/triggers/mcp-tool";
import { PieceCategory } from "@flow/shared";

export const mcp = createPiece({
  name: '@flow/piece-mcp',
  version: '0.0.16',
  displayName: "MCP",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.50.2',
  logoUrl: "/pieces/mcp.svg",
  authors: ['Gamal72', 'hazemadelkhalel'],
  description: 'Connect to your hosted MCP Server using any MCP client to communicate with tools',
  actions: [replyToMcpClient],
  triggers: [mcpTool],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE,PieceCategory.UNIVERSAL_AI]
});
