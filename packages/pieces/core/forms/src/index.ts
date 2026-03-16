import { createPiece, PieceAuth } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { onChatSubmission } from './lib/triggers/chat-trigger';
import { onFormSubmission } from './lib/triggers/form-trigger';
import { returnResponse } from './lib/actions/return-response';

export const forms = createPiece({
  name: '@flow/piece-forms',
  version: '0.4.14',
  displayName: 'Human Input',
  description: 'Trigger a flow through human input.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.65.0',
  categories: [PieceCategory.CORE],
  logoUrl: '/pieces/human-input.svg',
  authors: ['anasbarg', 'MoShizzle', 'abuaboud'],
  actions: [returnResponse],
  triggers: [onFormSubmission, onChatSubmission],
});
