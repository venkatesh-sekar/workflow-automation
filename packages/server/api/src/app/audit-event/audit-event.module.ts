import { ProjectResourceType, securityAccess } from '@activepieces/server-common'
import { Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { auditEventService } from './audit-event.service'

export const auditEventModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(auditEventController, { prefix: '/v1/audit-events' })
}

const auditEventController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListAuditEventsParams, async (request, reply) => {
        const events = await auditEventService.list({
            projectId: request.projectId,
            limit: request.query.limit,
        })
        return reply.status(StatusCodes.OK).send(events)
    })
}

const ListAuditEventsParams = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.READ_FLOW, {
                type: ProjectResourceType.QUERY,
            }),
    },
    schema: {
        querystring: z.object({
            projectId: z.string(),
            limit: z.coerce.number().int().min(1).max(100).optional().default(50),
        }),
    },
}
