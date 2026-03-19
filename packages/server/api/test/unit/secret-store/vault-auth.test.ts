import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockedPost } = vi.hoisted(() => {
    return { mockedPost: vi.fn() }
})

vi.mock('@flow/server-common', () => ({
    flowAxios: {
        post: mockedPost,
    },
}))

import { createVaultAuth } from '../../../src/app/secret-store/vault-auth'

describe('vault-auth', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        mockedPost.mockReset()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should login and return a token', async () => {
        mockedPost.mockResolvedValueOnce({
            data: {
                auth: {
                    client_token: 'test-token-123',
                    lease_duration: 1200,
                },
            },
        })

        const auth = createVaultAuth({
            addr: 'https://vault.test:8200',
            username: 'testuser',
            password: 'testpass',
        })

        const token = await auth.getToken()
        expect(token).toBe('test-token-123')
        expect(mockedPost).toHaveBeenCalledWith(
            'https://vault.test:8200/v1/auth/userpass/login/testuser',
            { password: 'testpass' },
        )
    })

    it('should reuse cached token when not expired', async () => {
        mockedPost.mockResolvedValueOnce({
            data: {
                auth: {
                    client_token: 'test-token-123',
                    lease_duration: 1200,
                },
            },
        })

        const auth = createVaultAuth({
            addr: 'https://vault.test:8200',
            username: 'testuser',
            password: 'testpass',
        })

        await auth.getToken()
        const token2 = await auth.getToken()
        expect(token2).toBe('test-token-123')
        expect(mockedPost).toHaveBeenCalledTimes(1)
    })

    it('should refresh token when within 2 min of expiry', async () => {
        mockedPost
            .mockResolvedValueOnce({
                data: { auth: { client_token: 'token-1', lease_duration: 1200 } },
            })
            .mockResolvedValueOnce({
                data: { auth: { client_token: 'token-2', lease_duration: 1200 } },
            })

        const auth = createVaultAuth({
            addr: 'https://vault.test:8200',
            username: 'testuser',
            password: 'testpass',
        })

        await auth.getToken()

        // Advance time to 19 minutes (within 2 min buffer of 20 min expiry)
        vi.advanceTimersByTime(19 * 60 * 1000)

        const token = await auth.getToken()
        expect(token).toBe('token-2')
        expect(mockedPost).toHaveBeenCalledTimes(2)
    })

    it('should throw on login failure', async () => {
        mockedPost.mockRejectedValueOnce(new Error('Connection refused'))

        const auth = createVaultAuth({
            addr: 'https://vault.test:8200',
            username: 'testuser',
            password: 'testpass',
        })

        await expect(auth.getToken()).rejects.toThrow('Connection refused')
    })
})
