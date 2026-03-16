import { PieceAuth, createPiece } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { httpSendRequestAction } from './lib/actions/send-http-request-action';

export const http = createPiece({
  name: '@flow/piece-http',
  version: '0.11.7',
  displayName: 'HTTP',
  description: 'Sends HTTP requests and return responses',
  logoUrl: '/pieces/http.svg',
  categories: [PieceCategory.CORE],
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.3',
  actions: [httpSendRequestAction],
  authors: [
    'bibhuty-did-this',
    'landonmoir',
    'JanHolger',
    'Salem-Alaa',
    'kishanprmr',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'pfernandez98',
  ],
  triggers: [],
});
