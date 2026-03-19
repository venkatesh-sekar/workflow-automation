import { UserAuthConnectionValue, AppConnectionType } from '@flow/shared'
import axios from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { USER_AUTH_TOKEN_URL, USER_AUTH_SCOPE } from './user-auth-constants'

export const userAuthService = (log: FastifyBaseLogger) => ({
    async claim(params: UserAuthClaimRequest): Promise<UserAuthConnectionValue> {
        const { clientId, clientSecret, username, password } = params

        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

        const response = await axios.post(
            USER_AUTH_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'password',
                username,
                password,
                scope: USER_AUTH_SCOPE,
            }).toString(),
            {
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        )

        const { access_token, expires_in } = response.data
        const secondsSinceEpoch = Math.round(Date.now() / 1000)

        log.info({ username }, 'User auth token claimed successfully')

        return {
            type: AppConnectionType.USER_AUTH,
            client_id: clientId,
            client_secret: clientSecret,
            username,
            password,
            access_token,
            expires_in: expires_in ?? 3600,
            claimed_at: secondsSinceEpoch,
        }
    },

    async refresh(connectionValue: UserAuthConnectionValue): Promise<UserAuthConnectionValue> {
        return this.claim({
            clientId: connectionValue.client_id,
            clientSecret: connectionValue.client_secret,
            username: connectionValue.username,
            password: connectionValue.password,
        })
    },

    isExpired(connectionValue: UserAuthConnectionValue): boolean {
        const secondsSinceEpoch = Math.round(Date.now() / 1000)
        const expiresIn = connectionValue.expires_in ?? 3600
        const refreshThreshold = 15 * 60
        return (
            secondsSinceEpoch + refreshThreshold >= connectionValue.claimed_at + expiresIn
        )
    },
})

type UserAuthClaimRequest = {
    clientId: string
    clientSecret: string
    username: string
    password: string
}
