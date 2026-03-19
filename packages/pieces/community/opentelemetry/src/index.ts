import { createPiece } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { opentelemetryAuth } from './lib/auth';
import { recordCounterAction } from './lib/actions/record-counter';
import { recordGaugeAction } from './lib/actions/record-gauge';

export const opentelemetry = createPiece({
  name: '@flow/piece-opentelemetry',
  version: '0.0.1',
  displayName: 'OpenTelemetry',
  auth: opentelemetryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/opentelemetry.png',
  authors: [],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [recordCounterAction, recordGaugeAction],
  triggers: [],
});
