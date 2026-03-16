import { PieceAuth, createPiece } from '@flow/pieces-framework';
import { PieceCategory } from '@flow/shared';
import { cronExpressionTrigger } from './lib/triggers/cron-expression.trigger';
import { everyDayTrigger } from './lib/triggers/every-day.trigger';
import { everyHourTrigger } from './lib/triggers/every-hour.trigger';
import { everyMonthTrigger } from './lib/triggers/every-month.trigger';
import { everyWeekTrigger } from './lib/triggers/every-week.trigger';
import { everyXMinutesTrigger } from './lib/triggers/every-x-minutes.trigger';

export const schedule = createPiece({
  name: '@flow/piece-schedule',
  version: '0.1.17',
  displayName: 'Schedule',
  logoUrl: '',
  description: 'Trigger flow with fixed schedule',
  categories: [PieceCategory.CORE],
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  authors: ["kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [],
  triggers: [
    everyXMinutesTrigger,
    everyHourTrigger,
    everyDayTrigger,
    everyWeekTrigger,
    everyMonthTrigger,
    cronExpressionTrigger,
  ],
});
