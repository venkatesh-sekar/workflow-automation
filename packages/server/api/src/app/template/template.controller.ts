import { securityAccess } from '@activepieces/server-common'
import {
    ALL_PRINCIPAL_TYPES,
    CreateTemplateRequestBody,
    ListTemplatesRequestQuery,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateTemplateRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { platformMustBeOwnedByCurrentUser } from '../helper/ee-authorization-stub'
import { migrateFlowVersionTemplateList } from '../flows/flow-version/migrations'
import { templateService } from './template.service'

export const templateController: FastifyPluginAsyncZod = async (app) => {
    app.get('/:id', GetParams, async (request) => {
        return templateService(app.log).getOneOrThrow({ id: request.params.id })
    })

    app.get('/', ListTemplatesParams, async (request) => {
        const platformId = request.principal.type === PrincipalType.UNKNOWN || request.principal.type === PrincipalType.WORKER ? null : request.principal.platform.id
        const templates = await templateService(app.log).list({ platformId, ...request.query })
        return templates
    })

    app.post('/', {
        ...CreateParams,
        preValidation: async (request) => {
            const migratedFlows = await migrateFlowVersionTemplateList(request.body.flows ?? [])
            request.body.flows = migratedFlows
        },
    }, async (request, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, request, reply)
        const platformId = request.principal.platform.id
        const result = await templateService(app.log).create({ platformId, params: request.body })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    app.post('/:id', { ...UpdateParams,
        preValidation: async (request) => {
            const migratedFlows = await migrateFlowVersionTemplateList(request.body.flows ?? [])
            request.body.flows = migratedFlows
        },
    }, async (request, reply) => {
        const result = await templateService(app.log).update({ id: request.params.id, params: request.body })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.delete('/:id', DeleteParams, async (request, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, request, reply)
        await templateService(app.log).delete({
            id: request.params.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
    
}

const GetIdParams = z.object({
    id: z.string(),
})
type GetIdParams = z.infer<typeof GetIdParams>

const GetParams = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['templates'],
        description: 'Get a template.',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
    },
}

const ListTemplatesParams = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        tags: ['templates'],
        description: 'List templates.',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListTemplatesRequestQuery,
    },
}

const DeleteParams = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        description: 'Delete a template.',
        tags: ['templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
    },
}

const CreateParams = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        description: 'Create a template.',
        tags: ['templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateTemplateRequestBody,
    },
}

const UpdateParams = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        description: 'Update a template.',
        tags: ['templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
        body: UpdateTemplateRequestBody,
    },
}

