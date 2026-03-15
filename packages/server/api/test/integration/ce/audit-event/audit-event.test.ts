import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createTestContext } from '../../../helpers/test-context'
import { db } from '../../../helpers/db'
import { apId } from '@flow/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Audit Event API', () => {
    describe('GET /v1/audit-events', () => {
        it('should return empty list when no audit events exist', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/audit-events', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(0)
        })

        it('should return audit events for the project', async () => {
            const ctx = await createTestContext(app!)

            await db.save('audit_event', {
                id: apId(),
                projectId: ctx.project.id,
                userId: ctx.user.id,
                event: 'FLOW_CREATED',
                data: { flowId: 'test-flow-1', displayName: 'My Flow' },
            })

            const response = await ctx.get('/v1/audit-events', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBeGreaterThanOrEqual(1)
            const event = body.data.find((e: Record<string, unknown>) => e.event === 'FLOW_CREATED')
            expect(event).toBeDefined()
            expect(event.projectId).toBe(ctx.project.id)
            expect(event.userId).toBe(ctx.user.id)
            expect(event.data).toMatchObject({ flowId: 'test-flow-1' })
        })

        it('should not return audit events from other projects', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)

            await db.save('audit_event', {
                id: apId(),
                projectId: ctx1.project.id,
                userId: ctx1.user.id,
                event: 'FLOW_DELETED',
                data: { flowId: 'secret-flow' },
            })

            const response = await ctx2.get('/v1/audit-events', {
                projectId: ctx2.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const leaked = body.data.find((e: Record<string, unknown>) => (e.data as Record<string, unknown>)?.flowId === 'secret-flow')
            expect(leaked).toBeUndefined()
        })

        it('should return events in descending order by created', async () => {
            const ctx = await createTestContext(app!)

            await db.save('audit_event', {
                id: apId(),
                projectId: ctx.project.id,
                userId: ctx.user.id,
                event: 'FLOW_CREATED',
                data: { order: 'first' },
            })
            await db.save('audit_event', {
                id: apId(),
                projectId: ctx.project.id,
                userId: ctx.user.id,
                event: 'FLOW_UPDATED',
                data: { order: 'second' },
            })

            const response = await ctx.get('/v1/audit-events', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBeGreaterThanOrEqual(2)
            const firstCreated = new Date(body.data[0].created).getTime()
            const secondCreated = new Date(body.data[1].created).getTime()
            expect(firstCreated).toBeGreaterThanOrEqual(secondCreated)
        })

        it('should respect the limit parameter', async () => {
            const ctx = await createTestContext(app!)

            for (let i = 0; i < 5; i++) {
                await db.save('audit_event', {
                    id: apId(),
                    projectId: ctx.project.id,
                    userId: ctx.user.id,
                    event: 'FLOW_UPDATED',
                    data: { index: i },
                })
            }

            const response = await ctx.get('/v1/audit-events', {
                projectId: ctx.project.id,
                limit: '2',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(2)
        })
    })

    describe('Audit hooks on flow operations', () => {
        it('should create FLOW_CREATED audit event when a flow is created', async () => {
            const ctx = await createTestContext(app!)

            await ctx.post('/v1/flows', {
                displayName: 'Audited Flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })

            const response = await ctx.get('/v1/audit-events', {
                projectId: ctx.project.id,
            })

            const body = response?.json()
            const event = body.data.find((e: Record<string, unknown>) => e.event === 'FLOW_CREATED')
            expect(event).toBeDefined()
            expect(event.userId).toBe(ctx.user.id)
            expect((event.data as Record<string, unknown>).displayName).toBe('Audited Flow')
        })

        it('should create FLOW_DELETED audit event when a flow is deleted', async () => {
            const ctx = await createTestContext(app!)

            const createRes = await ctx.post('/v1/flows', {
                displayName: 'To Delete',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow = createRes?.json()

            await ctx.delete(`/v1/flows/${flow.id}`, {
                projectId: ctx.project.id,
            })

            const response = await ctx.get('/v1/audit-events', {
                projectId: ctx.project.id,
            })

            const body = response?.json()
            const event = body.data.find((e: Record<string, unknown>) => e.event === 'FLOW_DELETED')
            expect(event).toBeDefined()
            expect((event.data as Record<string, unknown>).flowId).toBe(flow.id)
        })
    })
})
