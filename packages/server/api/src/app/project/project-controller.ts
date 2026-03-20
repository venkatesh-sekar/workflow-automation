import { ProjectResourceType, securityAccess } from '@flow/server-common'
import { FlowId, assertNotNullOrUndefined, CreatePlatformProjectRequest, PrincipalType, Project, ProjectType, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, UpdateProjectRequestInCommunity } from '@flow/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { userService } from '../user/user-service'
import { projectService } from './project-service'

export const projectController: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post('/', CreateProjectRequest, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        assertNotNullOrUndefined(user.platformId, 'platformId is undefined')
        return projectService(request.log).create({
            ownerId: user.id,
            displayName: request.body.displayName,
            type: ProjectType.TEAM,
            platformId: user.platformId,
            externalId: request.body.externalId ?? undefined,
            metadata: request.body.metadata ?? undefined,
            maxConcurrentJobs: request.body.maxConcurrentJobs ?? undefined,
        })
    })

    fastify.delete('/:id', DeleteProjectRequest, async (request, reply) => {
        await projectService(request.log).softDelete(request.params.id)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    fastify.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService(request.log).getOneOrThrow(request.params.id)
        return projectService(request.log).update(request.params.id, {
            type: project.type,
            ...request.body,
        })
    })

    fastify.get('/:id', GetProjectRequest, async (request) => {
        return projectService(request.log).getOneOrThrow(request.projectId)
    })

    fastify.get('/', ListProjectsRequest, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        assertNotNullOrUndefined(user.platformId, 'platformId is undefined')
        const projects = await projectService(request.log).getAllForUser({
            platformId: user.platformId,
            userId: request.principal.id,
            isPrivileged: userService(request.log).isUserPrivileged(user),
        })
        return paginationHelper.createPage(projects, null)
    })
}

const UpdateProjectRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['projects'],
        params: z.object({
            id: z.string(),
        }),
        response: {
            [StatusCodes.OK]: Project,
        },
        body: UpdateProjectRequestInCommunity,
    },
}


const GetProjectRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.PARAM,
            paramKey: 'id',
        }),
    },
    schema: {
        tags: ['projects'],
        params: z.object({
            id: FlowId,
        }),
        response: {
            [StatusCodes.OK]: Project,
        },
    },
}   

const ListProjectsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['projects'],
        response: {
            [StatusCodes.OK]: SeekPage(Project),
        },
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const CreateProjectRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['projects'],
        body: CreatePlatformProjectRequest,
        response: {
            [StatusCodes.OK]: Project,
        },
    },
}

const DeleteProjectRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['projects'],
        params: z.object({
            id: z.string(),
        }),
    },
}