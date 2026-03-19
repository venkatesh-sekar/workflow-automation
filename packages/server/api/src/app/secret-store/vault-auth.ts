import { flowAxios } from '@flow/server-common'
import { isAxiosError } from 'axios'

type VaultAuthConfig = {
    addr: string
    username: string
    password: string
}

type CachedToken = {
    token: string
    expiresAt: number
}

const REFRESH_BUFFER_MS = 2 * 60 * 1000 // 2 minutes

export function createVaultAuth(config: VaultAuthConfig) {
    let cached: CachedToken | null = null

    async function login(): Promise<CachedToken> {
        try {
            const response = await flowAxios.post(
                `${config.addr}/v1/auth/userpass/login/${config.username}`,
                { password: config.password },
            )
            const { client_token, lease_duration } = response.data.auth
            return {
                token: client_token,
                expiresAt: Date.now() + lease_duration * 1000,
            }
        }
        catch (error) {
            const status = isAxiosError(error) ? `${error.response?.status} ${error.response?.statusText}` : 'unknown error'
            throw new Error(`Vault authentication failed: ${status}`)
        }
    }

    return {
        async getToken(): Promise<string> {
            if (cached && Date.now() < cached.expiresAt - REFRESH_BUFFER_MS) {
                return cached.token
            }
            cached = await login()
            return cached.token
        },
    }
}
