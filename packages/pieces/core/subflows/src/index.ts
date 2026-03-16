import { createPiece, PieceAuth } from '@flow/pieces-framework';
import { callFlow } from './lib/actions/call-flow';
import { callableFlow } from './lib/triggers/callable-flow';
import { response } from './lib/actions/respond';
import { PieceCategory } from '@flow/shared';

export const flows = createPiece({
  name: '@flow/piece-subflows',
  version: '0.4.11',
  displayName: 'Sub Flows',
  description: 'Trigger and call another sub flow.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.67.1',
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  logoUrl: '/pieces/subflows.svg',
  authors: ['hazemadelkhalel'],
  actions: [callFlow, response],
  triggers: [callableFlow],
});
