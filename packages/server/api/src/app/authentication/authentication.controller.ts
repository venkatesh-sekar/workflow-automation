import { AppSystemProp, securityAccess } from '@flow/server-common'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { system } from '../helper/system/system'
import { authenticationService } from './authentication.service'

const TeamLoginRequest = z.object({
    email: z.string().email(),
    apiKey: z.string().min(1),
})

export const authenticationController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.post('/team-login', TeamLoginRequestOptions, async (request) => {
        return authenticationService(request.log).teamLogin({
            email: request.body.email,
            apiKey: request.body.apiKey,
        })
    })
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}

const TeamLoginRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: TeamLoginRequest,
    },
}
