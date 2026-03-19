import { PieceAuth, createPiece } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';

export const userAuth = createPiece({
  name: '@flow/piece-user-auth',
  version: '0.1.0',
  displayName: 'User Auth',
  description: 'OAuth2 password-grant connection using client credentials and user credentials',
  logoUrl: '/pieces/user-auth.svg',
  categories: [PieceCategory.CORE],
  auth: PieceAuth.UserAuth({
    displayName: 'User Auth Connection',
    description: 'Enter your client credentials and user credentials. The system will automatically fetch and refresh the access token.',
    required: true,
  }),
  minimumSupportedRelease: '0.20.3',
  actions: [],
  triggers: [],
  authors: [],
});
