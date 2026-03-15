import { createPiece } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { postgresAuth } from './lib/auth';
import { runQuery } from './lib/actions/run-query';
import { newRow } from './lib/triggers/new-row';

export { postgresAuth } from './lib/auth';

export const postgres = createPiece({
  displayName: 'Postgres',
  description: "The world's most advanced open-source relational database",
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  logoUrl: 'https://cdn.activepieces.com/pieces/postgres.png',
  authors: ["AbdullahBitar", "Willianwg", "dentych", "kishanprmr", "AbdulTheActivePiecer", "khaledmashaly", "abuaboud"],
  auth: postgresAuth,
  actions: [runQuery],
  triggers: [newRow],
});
