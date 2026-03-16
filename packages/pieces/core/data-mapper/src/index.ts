import { PieceAuth, createPiece } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { advancedMapping } from './lib/actions/advanced-mapping';

export const dataMapper = createPiece({
  name: '@flow/piece-data-mapper',
  version: '0.3.15',
  displayName: 'Data Mapper',
  description: 'tools to manipulate data structure',

  minimumSupportedRelease: '0.30.0',
  logoUrl: '/pieces/data-mapper.svg',
  auth: PieceAuth.None(),
  categories: [PieceCategory.CORE],
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [advancedMapping],
  triggers: [],
});
