import {
    ActivepiecesError,
    AuthenticationResponse,
    ErrorCode,
    isNil,
    PrincipalType,
} from '@activepieces/shared'
import crypto from 'crypto'
import { FastifyBaseLogger } from 'fastify'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { accessTokenManager } from './lib/access-token-manager'

export const authenticationService = (log: FastifyBaseLogger) => ({
    async teamLogin(params: TeamLoginParams): Promise<AuthenticationResponse> {
        const apiKeyHash = crypto.createHash('sha256').update(params.apiKey).digest('hex')
        const project = await projectService(log).findByApiKeyHash(apiKeyHash)
        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Invalid team key',
                },
            })
        }
        const user = await userService(log).getOneByPlatformAndEmail({
            platformId: project.platformId,
            email: params.email,
        })
        if (isNil(user)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Invalid email or team key',
                },
            })
        }
        // Verify user has access to this project
        const userProjects = await projectService(log).getAllForUser({
            platformId: project.platformId,
            userId: user.id,
            isPrivileged: userService(log).isUserPrivileged(user),
        })
        const hasAccess = userProjects.some(p => p.id === project.id)
        if (!hasAccess) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Invalid email or team key',
                },
            })
        }
        const token = await accessTokenManager(log).generateToken({
            id: user.id,
            type: PrincipalType.USER,
            platform: {
                id: project.platformId,
            },
            tokenVersion: user.tokenVersion ?? undefined,
        })
        log.info({ email: params.email, projectId: project.id }, 'User logged in via team key')
        return {
            ...user,
            token,
            projectId: project.id,
        }
    },
})

type TeamLoginParams = {
    email: string
    apiKey: string
}
