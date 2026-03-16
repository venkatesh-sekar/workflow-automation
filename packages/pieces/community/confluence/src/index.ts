import { createPiece, PieceAuth, Property ,PiecePropValueSchema, Piece} from "@flow/pieces-framework";
import { getPageContent } from "./lib/actions/get-page-content";
import { newPageTrigger } from "./lib/triggers/new-page";
import { PieceCategory } from "@flow/shared";
import { createCustomApiCallAction } from "@flow/pieces-common";
import { createPageFromTemplateAction } from "./lib/actions/create-page-from-template";
import { confluenceAuth } from './lib/auth';

export const confluence = createPiece({
  name: '@flow/piece-confluence',
  version: '0.2.4',
  displayName: "Confluence",
  auth: confluenceAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: "/pieces/confluence.png",
  authors: ["geekyme"],
  actions: [getPageContent,createPageFromTemplateAction,
    createCustomApiCallAction({
      baseUrl:(auth)=>{
        return `${ auth?.props.confluenceDomain?? ''}/wiki/api/v2`;
      },
      auth: confluenceAuth,
      authMapping: async (auth) => {
        const authValue = auth.props
        return {
          Authorization: `Basic ${Buffer.from(`${authValue.username}:${authValue.password}`).toString('base64')}`,
        };
      },
    })
  ],
  categories: [PieceCategory.CONTENT_AND_FILES],
  triggers: [newPageTrigger],
});
