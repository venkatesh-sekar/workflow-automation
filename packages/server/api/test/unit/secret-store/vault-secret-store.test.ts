import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockedPut, mockedGet, mockedDelete } = vi.hoisted(() => {
    return {
        mockedPut: vi.fn(),
        mockedGet: vi.fn(),
        mockedDelete: vi.fn(),
    }
})

vi.mock('@flow/server-common', () => ({
    flowAxios: {
        put: mockedPut,
        get: mockedGet,
        delete: mockedDelete,
    },
}))

import { createVaultSecretStore } from '../../../src/app/secret-store/vault-secret-store'

describe('VaultSecretStore', () => {
    const mockGetToken = vi.fn().mockResolvedValue('mock-token')
    let store: ReturnType<typeof createVaultSecretStore>

    beforeEach(() => {
        vi.clearAllMocks()
        store = createVaultSecretStore({
            addr: 'https://vault.test:8200',
            mount: 'secret',
            getToken: mockGetToken,
        })
    })

    it('should save a secret to vault', async () => {
        mockedPut.mockResolvedValueOnce({ data: {} })

        await store.save('platform-1', 'conn-1', { secret_text: 'my-secret' })

        expect(mockedPut).toHaveBeenCalledWith(
            'https://vault.test:8200/v1/secret/flow/platform-1/conn-1',
            { secret_text: 'my-secret' },
            { headers: { 'X-Vault-Token': 'mock-token' } },
        )
    })

    it('should get a secret from vault', async () => {
        mockedGet.mockResolvedValueOnce({
            data: { data: { secret_text: 'my-secret' } },
        })

        const result = await store.get('platform-1', 'conn-1')

        expect(result).toEqual({ secret_text: 'my-secret' })
        expect(mockedGet).toHaveBeenCalledWith(
            'https://vault.test:8200/v1/secret/flow/platform-1/conn-1',
            { headers: { 'X-Vault-Token': 'mock-token' } },
        )
    })

    it('should delete a secret from vault', async () => {
        mockedDelete.mockResolvedValueOnce({ data: {} })

        await store.delete('platform-1', 'conn-1')

        expect(mockedDelete).toHaveBeenCalledWith(
            'https://vault.test:8200/v1/secret/flow/platform-1/conn-1',
            { headers: { 'X-Vault-Token': 'mock-token' } },
        )
    })

    it('should throw on vault read failure', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Vault unavailable'))

        await expect(store.get('platform-1', 'conn-1')).rejects.toThrow('Vault unavailable')
    })

    it('should throw on vault write failure', async () => {
        mockedPut.mockRejectedValueOnce(new Error('Vault unavailable'))

        await expect(store.save('platform-1', 'conn-1', {})).rejects.toThrow('Vault unavailable')
    })
})
