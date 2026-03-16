import { z } from 'zod';

import { formatUtils } from '@/lib/format-utils';

export const LoginSchema = z.object({
  email: z.string().regex(formatUtils.emailRegex, 'Email is invalid'),
  apiKey: z.string().min(1, 'Team key is required'),
});

export type LoginSchema = z.infer<typeof LoginSchema>;
