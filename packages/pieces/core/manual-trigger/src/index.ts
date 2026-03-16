
    import { createPiece, PieceAuth } from "@flow/pieces-framework";
import { manualTrigger } from "./lib/triggers/manual-trigger";
import { PieceCategory } from "@flow/shared";

export const manualTriggerPiece = createPiece({
      name: '@flow/piece-manual-trigger',
      version: '0.0.5',
      displayName: "Manual Trigger",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.78.0',
      logoUrl: "/pieces/manual-trigger.svg",
      authors: ['AbdulTheActivePiecer'],
      actions: [],
      triggers: [manualTrigger],
      categories:[PieceCategory.CORE]
    });
    