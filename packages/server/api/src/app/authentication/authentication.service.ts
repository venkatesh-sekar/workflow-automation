import {
    ActivepiecesError,
    AuthenticationResponse,
    ErrorCode,
    isNil,
    PrincipalType,
} from '@flow/shared'
import crypto from 'crypto'
import { FastifyBaseLogger } from 'fastify'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { accessTokenManager } from './lib/access-token-manager'
import { userIdentityService } from './user-identity/user-identity-service'

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

        // Look up identity by email, then find user by identity + platform
        const identity = await userIdentityService(log).getIdentityByEmail(params.email)
        if (isNil(identity)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Invalid email or team key',
                },
            })
        }

        const user = await userService(log).getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId: project.platformId,
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
            tokenVersion: identity.tokenVersion,
        })
        log.info({ email: params.email, projectId: project.id }, 'User logged in via team key')
        return {
            ...user,
            firstName: identity.firstName,
            lastName: identity.lastName,
            email: identity.email,
            verified: identity.verified,
            token,
            projectId: project.id,
        }
    },
})

type TeamLoginParams = {
    email: string
    apiKey: string
}
