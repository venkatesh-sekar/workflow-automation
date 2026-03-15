import { t } from 'i18next';
import { z } from 'zod';

import { formatUtils } from '@/lib/format-utils';

export const LoginSchema = z.object({
  email: z.string().regex(formatUtils.emailRegex, t('Email is invalid')),
  apiKey: z.string().min(1, t('Team key is required')),
});

export type LoginSchema = z.infer<typeof LoginSchema>;
