import { PieceAuth, createPiece } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { readConnection } from './lib/actions/read-connection';

export const connections = createPiece({
  name: '@flow/piece-connections',
  version: '0.5.4',
  displayName: 'Connections',
  description: 'Read connections dynamically',
  minimumSupportedRelease: '0.36.1',
  logoUrl: '/pieces/connections.svg',
  categories: [PieceCategory.CORE],
  auth: PieceAuth.None(),
  authors: ["kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [readConnection],
  triggers: [],
});
