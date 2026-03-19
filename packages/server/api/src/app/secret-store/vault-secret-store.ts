import { flowAxios } from '@flow/server-common'
import { isAxiosError } from 'axios'
import { SecretStore } from './secret-store'

type VaultSecretStoreConfig = {
    addr: string
    mount: string
    getToken: () => Promise<string>
}

export function createVaultSecretStore(config: VaultSecretStoreConfig): SecretStore {
    function vaultUrl(platformId: string, connectionId: string): string {
        return `${config.addr}/v1/${config.mount}/flow/${platformId}/${connectionId}`
    }

    async function headers(): Promise<{ 'X-Vault-Token': string }> {
        const token = await config.getToken()
        return { 'X-Vault-Token': token }
    }

    function sanitizeVaultError(error: unknown, operation: string, connectionId: string): Error {
        const status = isAxiosError(error) ? `${error.response?.status} ${error.response?.statusText}` : 'unknown error'
        return new Error(`Vault ${operation} failed for connection ${connectionId}: ${status}`)
    }

    return {
        async save(platformId: string, connectionId: string, value: object): Promise<void> {
            try {
                await flowAxios.put(
                    vaultUrl(platformId, connectionId),
                    value,
                    { headers: await headers() },
                )
            }
            catch (error) {
                throw sanitizeVaultError(error, 'PUT', connectionId)
            }
        },

        async get(platformId: string, connectionId: string): Promise<object> {
            try {
                const response = await flowAxios.get(
                    vaultUrl(platformId, connectionId),
                    { headers: await headers() },
                )
                return response.data.data
            }
            catch (error) {
                throw sanitizeVaultError(error, 'GET', connectionId)
            }
        },

        async delete(platformId: string, connectionId: string): Promise<void> {
            try {
                await flowAxios.delete(
                    vaultUrl(platformId, connectionId),
                    { headers: await headers() },
                )
            }
            catch (error) {
                throw sanitizeVaultError(error, 'DELETE', connectionId)
            }
        },
    }
}
