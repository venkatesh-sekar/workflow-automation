import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createTestContext } from '../../../helpers/test-context'
import { db } from '../../../helpers/db'
import { createMockTemplate } from '../../../helpers/mocks'
import { TemplateScope } from '@flow/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Template Scope', () => {
    describe('POST /v1/templates', () => {
        it('should default scope to TEAM when not specified', async () => {
            const ctx = await createTestContext(app!)

            const mockTemplate = createMockTemplate({
                platformId: ctx.platform.id,
            })

            const response = await ctx.post('/v1/templates', {
                name: mockTemplate.name,
                summary: mockTemplate.summary,
                description: mockTemplate.description,
                flows: mockTemplate.flows,
                tags: mockTemplate.tags,
                blogUrl: mockTemplate.blogUrl,
                author: mockTemplate.author,
                categories: mockTemplate.categories,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.scope).toBe(TemplateScope.TEAM)
        })

        it('should accept GLOBAL scope', async () => {
            const ctx = await createTestContext(app!)

            const mockTemplate = createMockTemplate({
                platformId: ctx.platform.id,
            })

            const response = await ctx.post('/v1/templates', {
                name: mockTemplate.name,
                summary: mockTemplate.summary,
                description: mockTemplate.description,
                flows: mockTemplate.flows,
                tags: mockTemplate.tags,
                blogUrl: mockTemplate.blogUrl,
                author: mockTemplate.author,
                categories: mockTemplate.categories,
                scope: TemplateScope.GLOBAL,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.scope).toBe(TemplateScope.GLOBAL)
        })
    })

    describe('GET /v1/templates', () => {
        it('should return all templates when no scope filter is provided', async () => {
            const ctx = await createTestContext(app!)

            const teamTemplate = createMockTemplate({
                platformId: ctx.platform.id,
                scope: TemplateScope.TEAM,
            })
            const globalTemplate = createMockTemplate({
                platformId: ctx.platform.id,
                scope: TemplateScope.GLOBAL,
            })
            await db.save('template', teamTemplate)
            await db.save('template', globalTemplate)

            const response = await ctx.get('/v1/templates')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const ids = body.data.map((t: Record<string, unknown>) => t.id)
            expect(ids).toContain(teamTemplate.id)
            expect(ids).toContain(globalTemplate.id)
        })

        it('should filter by TEAM scope', async () => {
            const ctx = await createTestContext(app!)

            const teamTemplate = createMockTemplate({
                platformId: ctx.platform.id,
                scope: TemplateScope.TEAM,
            })
            const globalTemplate = createMockTemplate({
                platformId: ctx.platform.id,
                scope: TemplateScope.GLOBAL,
            })
            await db.save('template', teamTemplate)
            await db.save('template', globalTemplate)

            const response = await ctx.get('/v1/templates', {
                scope: TemplateScope.TEAM,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const ids = body.data.map((t: Record<string, unknown>) => t.id)
            expect(ids).toContain(teamTemplate.id)
            expect(ids).not.toContain(globalTemplate.id)
        })

        it('should filter by GLOBAL scope', async () => {
            const ctx = await createTestContext(app!)

            const teamTemplate = createMockTemplate({
                platformId: ctx.platform.id,
                scope: TemplateScope.TEAM,
            })
            const globalTemplate = createMockTemplate({
                platformId: ctx.platform.id,
                scope: TemplateScope.GLOBAL,
            })
            await db.save('template', teamTemplate)
            await db.save('template', globalTemplate)

            const response = await ctx.get('/v1/templates', {
                scope: TemplateScope.GLOBAL,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const ids = body.data.map((t: Record<string, unknown>) => t.id)
            expect(ids).toContain(globalTemplate.id)
            expect(ids).not.toContain(teamTemplate.id)
        })
    })
})
