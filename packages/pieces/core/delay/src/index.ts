import { PieceAuth, createPiece } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { delayForAction } from './lib/actions/delay-for-action';
import { delayUntilAction } from './lib/actions/delay-until-action';

export const delay = createPiece({
  name: '@flow/piece-delay',
  version: '0.3.26',
  displayName: 'Delay',
  description: 'Use it to delay the execution of the next action',
  minimumSupportedRelease: '0.36.1',
  logoUrl: '',
  authors: ["Nilesh","kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  auth: PieceAuth.None(),
  actions: [
    delayForAction, // Delay for a fixed duration
    delayUntilAction, // Takes a timestamp parameter instead of duration
  ],
  triggers: [],
});
