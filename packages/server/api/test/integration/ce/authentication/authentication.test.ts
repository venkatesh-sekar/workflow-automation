import crypto from 'crypto'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    createMockUser,
    createMockPlatform,
    createMockProject,
} from '../../../helpers/mocks'
import { apId, PlatformRole, UserStatus } from '@flow/shared'
import { faker } from '@faker-js/faker'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Authentication API', () => {
    describe('POST /v1/authentication/team-login', () => {
        async function setupTeamWithOwner() {
            const apiKey = `flow_${crypto.randomBytes(32).toString('hex')}`
            const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

            const owner = createMockUser({
                platformRole: PlatformRole.ADMIN,
                verified: true,
            })
            await databaseConnection().getRepository('user').save(owner)

            const platform = createMockPlatform({
                ownerId: owner.id,
            })
            await databaseConnection().getRepository('platform').save(platform)

            owner.platformId = platform.id
            await databaseConnection().getRepository('user').save(owner)

            const project = createMockProject({
                ownerId: owner.id,
                platformId: platform.id,
            })
            await databaseConnection().getRepository('project').save(project)

            // Set apiKeyHash directly on the project row
            await databaseConnection().query(
                'UPDATE "project" SET "apiKeyHash" = $1 WHERE "id" = $2',
                [apiKeyHash, project.id],
            )

            return { apiKey, apiKeyHash, owner, platform, project }
        }

        it('should return JWT token for valid email and API key', async () => {
            const { apiKey, owner, project } = await setupTeamWithOwner()

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/team-login',
                body: {
                    email: owner.email,
                    apiKey,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toHaveProperty('token')
            expect(typeof body.token).toBe('string')
            expect(body.projectId).toBe(project.id)
            expect(body.id).toBe(owner.id)
            expect(body.email).toBe(owner.email)
        })

        it('should return firstName and lastName in response', async () => {
            const { apiKey, owner } = await setupTeamWithOwner()

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/team-login',
                body: {
                    email: owner.email,
                    apiKey,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.firstName).toBe(owner.firstName)
            expect(body.lastName).toBe(owner.lastName)
        })

        it('should reject invalid API key', async () => {
            const { owner } = await setupTeamWithOwner()

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/team-login',
                body: {
                    email: owner.email,
                    apiKey: 'flow_invalid_key_that_does_not_exist',
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })

        it('should reject email not found on platform', async () => {
            const { apiKey } = await setupTeamWithOwner()

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/team-login',
                body: {
                    email: 'stranger@example.com',
                    apiKey,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })

        it('should reject empty API key', async () => {
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/team-login',
                body: {
                    email: 'test@example.com',
                    apiKey: '',
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('should reject invalid email format', async () => {
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/team-login',
                body: {
                    email: 'not-an-email',
                    apiKey: 'flow_somekey',
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('should reject user from different platform', async () => {
            const { apiKey } = await setupTeamWithOwner()

            // Create a user on a DIFFERENT platform
            const otherOwner = createMockUser({
                platformRole: PlatformRole.ADMIN,
                verified: true,
            })
            await databaseConnection().getRepository('user').save(otherOwner)

            const otherPlatform = createMockPlatform({
                ownerId: otherOwner.id,
            })
            await databaseConnection().getRepository('platform').save(otherPlatform)

            otherOwner.platformId = otherPlatform.id
            await databaseConnection().getRepository('user').save(otherOwner)

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/authentication/team-login',
                body: {
                    email: otherOwner.email,
                    apiKey,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })
    })
})
