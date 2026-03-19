import { flowAxios } from '@flow/server-common'
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

    return {
        async save(platformId: string, connectionId: string, value: object): Promise<void> {
            await flowAxios.put(
                vaultUrl(platformId, connectionId),
                value,
                { headers: await headers() },
            )
        },

        async get(platformId: string, connectionId: string): Promise<object> {
            const response = await flowAxios.get(
                vaultUrl(platformId, connectionId),
                { headers: await headers() },
            )
            return response.data.data
        },

        async delete(platformId: string, connectionId: string): Promise<void> {
            await flowAxios.delete(
                vaultUrl(platformId, connectionId),
                { headers: await headers() },
            )
        },
    }
}
