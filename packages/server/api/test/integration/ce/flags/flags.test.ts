import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flags API', () => {
    describe('GET /v1/flags', () => {
        it('should return flags without authentication', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flags',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            expect(body).toHaveProperty('ENVIRONMENT')
            expect(typeof body.ENVIRONMENT).toBe('string')
            expect(body).toHaveProperty('WEBHOOK_URL_PREFIX')
            expect(typeof body.WEBHOOK_URL_PREFIX).toBe('string')
        })

        it('should return Flow branding in theme', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flags',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            expect(body).toHaveProperty('THEME')
            const theme = body.THEME
            expect(theme.websiteName).toBe('Flow')
            expect(theme.colors.primary.default).toBe('#dc2626')
        })

        it('should not contain Activepieces branding', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flags',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            const theme = body.THEME
            expect(theme.websiteName).not.toContain('Activepieces')
            expect(theme.logos.fullLogoUrl).not.toContain('activepieces.com')
            expect(theme.logos.favIconUrl).not.toContain('activepieces.com')
        })
    })
})
