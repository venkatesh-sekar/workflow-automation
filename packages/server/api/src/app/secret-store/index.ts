import { FlowSystemProp } from '@flow/server-common'
import { system } from '../helper/system/system'
import { SecretStore } from './secret-store'
import { createVaultAuth } from './vault-auth'
import { createVaultSecretStore } from './vault-secret-store'

let secretStoreInstance: SecretStore | null = null

export async function initializeSecretStore(): Promise<void> {
    const log = system.globalLogger()

    const addr = system.getOrThrow(FlowSystemProp.VAULT_ADDR)
    const username = system.getOrThrow(FlowSystemProp.VAULT_USERNAME)
    const password = system.getOrThrow(FlowSystemProp.VAULT_PASSWORD)
    const mount = system.get(FlowSystemProp.VAULT_MOUNT) ?? 'secret'

    const url = new URL(addr)
    if (!url.protocol.startsWith('http')) {
        log.fatal({ addr }, 'FLOW_VAULT_ADDR must be a valid HTTP(S) URL')
        process.exit(1)
    }

    const vaultAuth = createVaultAuth({ addr, username, password })

    // Initial login — validates credentials at startup
    try {
        await vaultAuth.getToken()
    }
    catch (e) {
        log.fatal({ error: e }, 'Failed to authenticate with Vault')
        process.exit(1)
    }

    secretStoreInstance = createVaultSecretStore({
        addr,
        mount,
        getToken: () => vaultAuth.getToken(),
    })

    log.info({ addr, mount }, 'Vault secret store initialized')
}

export function secretStore(): SecretStore {
    if (!secretStoreInstance) {
        throw new Error('Secret store not initialized. Call initializeSecretStore() first.')
    }
    return secretStoreInstance
}

export { SecretStore } from './secret-store'
