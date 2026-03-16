import { createPiece, PieceAuth } from '@flow/pieces-framework';
import { calculateAverage } from './lib/actions/calculate-average';
import { calculateSum } from './lib/actions/calculate-sum';
import { countUniques } from './lib/actions/count-uniques';
import { getMinMax } from './lib/actions/get-min-max';
import { PieceCategory } from '@flow/shared';

export const dataSummarizer = createPiece({
  name: '@flow/piece-data-summarizer',
  version: '0.0.10',
  displayName: 'Data Summarizer',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: '/pieces/data-summarizer.svg',
  authors: ['tahboubali'],
  actions: [calculateAverage, calculateSum, countUniques, getMinMax],
  triggers: [],
  categories: [PieceCategory.CORE]
});
