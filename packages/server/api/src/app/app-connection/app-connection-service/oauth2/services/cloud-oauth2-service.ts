
import {
    CloudOAuth2ConnectionValue,
} from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'
import {
    ClaimOAuth2Request,
    OAuth2Service,
    RefreshOAuth2Request,
} from '../oauth2-service'

export const cloudOAuth2Service = (_log: FastifyBaseLogger): OAuth2Service<CloudOAuth2ConnectionValue> => ({
    refresh: async (
        _req: RefreshOAuth2Request<CloudOAuth2ConnectionValue>,
    ): Promise<CloudOAuth2ConnectionValue> => {
        throw new Error('Cloud OAuth2 is not supported in self-hosted mode')
    },
    claim: async (
        _req: ClaimOAuth2Request,
    ): Promise<CloudOAuth2ConnectionValue> => {
        throw new Error('Cloud OAuth2 is not supported in self-hosted mode')
    },
})
