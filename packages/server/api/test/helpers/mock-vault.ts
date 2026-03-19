import { vi } from 'vitest'

const vaultStore = new Map<string, object>()

export function createMockSecretStore() {
    return {
        save: vi.fn(async (platformId: string, connectionId: string, value: object) => {
            vaultStore.set(`${platformId}/${connectionId}`, value)
        }),
        get: vi.fn(async (platformId: string, connectionId: string) => {
            const value = vaultStore.get(`${platformId}/${connectionId}`)
            if (!value) {
                throw new Error(`Secret not found: ${platformId}/${connectionId}`)
            }
            return value
        }),
        delete: vi.fn(async (platformId: string, connectionId: string) => {
            vaultStore.delete(`${platformId}/${connectionId}`)
        }),
        clear: () => vaultStore.clear(),
    }
}
