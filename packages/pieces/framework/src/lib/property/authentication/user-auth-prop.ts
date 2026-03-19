import { z } from 'zod';
import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { BasePieceAuthSchema } from './common';

export const UserAuthPropertyValue = z.object({
    client_id: z.string(),
    client_secret: z.string(),
    username: z.string(),
    password: z.string(),
    access_token: z.string(),
    expires_in: z.number(),
    claimed_at: z.number(),
})

export type UserAuthPropertyValue = z.infer<typeof UserAuthPropertyValue>

export const UserAuthProperty = z.object({
    ...BasePieceAuthSchema.shape,
    ...TPropertyValue(UserAuthPropertyValue, PropertyType.USER_AUTH).shape,
})

export type UserAuthProperty<R extends boolean = boolean> =
    BasePieceAuthSchema<UserAuthPropertyValue> &
    TPropertyValue<
        UserAuthPropertyValue,
        PropertyType.USER_AUTH,
        R
    >;
