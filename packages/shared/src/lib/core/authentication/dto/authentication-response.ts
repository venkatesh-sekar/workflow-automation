import { z } from 'zod'
import { User } from '../../user/user'


export const UserWithoutPassword = User.pick({ id: true, platformRole: true, status: true, externalId: true, platformId: true })
export type UserWithoutPassword = z.infer<typeof UserWithoutPassword>

export const AuthenticationResponse = UserWithoutPassword.merge(
    User.pick({ verified: true, firstName: true, lastName: true, email: true }),
).merge(
    z.object({
        token: z.string(),
        projectId: z.string(),
    }),
)
export type AuthenticationResponse = z.infer<typeof AuthenticationResponse>
