import { ActivepiecesError,
    apId,
    ErrorCode,
    FederatedAuthnProviderConfig,
    FederatedAuthnProviderConfigWithoutSensitiveData,
    FilteredPieceBehavior,
    isNil,
    OPEN_SOURCE_PLAN,
    Platform,
    PlatformId,
    PlatformPlanLimits,
    PlatformWithoutSensitiveData,
    spreadIfDefined,
    UpdatePlatformRequestBody,
    UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { defaultTheme } from '../flags/theme'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { PlatformEntity } from './platform.entity'

export const platformRepo = repoFactory<Platform>(PlatformEntity)

export const platformService = (log: FastifyBaseLogger) => ({
    async create(params: AddParams): Promise<Platform> {
        const {
            ownerId,
            name,
            primaryColor,
            logoIconUrl,
            fullLogoUrl,
            favIconUrl,
        } = params

        const newPlatform: NewPlatform = {
            id: apId(),
            ownerId,
            name,
            primaryColor: primaryColor ?? defaultTheme.colors.primary.default,
            logoIconUrl: logoIconUrl ?? defaultTheme.logos.logoIconUrl,
            fullLogoUrl: fullLogoUrl ?? defaultTheme.logos.fullLogoUrl,
            favIconUrl: favIconUrl ?? defaultTheme.logos.favIconUrl,
            emailAuthEnabled: true,
            filteredPieceNames: [],
            enforceAllowedAuthDomains: false,
            allowedAuthDomains: [],
            filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            federatedAuthProviders: {},
            cloudAuthEnabled: true,
            pinnedPieces: [],
        }

        const savedPlatform = await platformRepo().save(newPlatform)
        await userService(log).addOwnerToPlatform({
            id: ownerId,
            platformId: savedPlatform.id,
        })

        log.info({ platformId: savedPlatform.id, ownerId }, 'Platform created')
        return savedPlatform
    },
    async getAll(): Promise<Platform[]> {
        return platformRepo().find()
    },
    async getOldestPlatform(): Promise<Platform | null> {
        return platformRepo().findOne({
            where: {},
            order: {
                created: 'ASC',
            },
        })
    },
    async update(params: UpdateParams): Promise<Platform> {
        const platform = await this.getOneOrThrow(params.id)
        const federatedAuthProviders = {
            ...platform.federatedAuthProviders,
            ...(params.federatedAuthProviders ?? {}),
        }
        const updatedPlatform: Platform = {
            ...platform,
            federatedAuthProviders,
            ...spreadIfDefined('name', params.name),
            ...spreadIfDefined('primaryColor', params.primaryColor),
            ...spreadIfDefined('logoIconUrl', params.logoIconUrl),
            ...spreadIfDefined('fullLogoUrl', params.fullLogoUrl),
            ...spreadIfDefined('favIconUrl', params.favIconUrl),
            ...spreadIfDefined('filteredPieceNames', params.filteredPieceNames),
            ...spreadIfDefined('filteredPieceBehavior', params.filteredPieceBehavior),
            ...spreadIfDefined('cloudAuthEnabled', params.cloudAuthEnabled),
            ...spreadIfDefined('emailAuthEnabled', params.emailAuthEnabled),
            ...spreadIfDefined(
                'enforceAllowedAuthDomains',
                params.enforceAllowedAuthDomains,
            ),
            ...spreadIfDefined('allowedAuthDomains', params.allowedAuthDomains),
            ...spreadIfDefined('pinnedPieces', params.pinnedPieces),
        }
        log.info({ platformId: params.id }, 'Platform updated')
        return platformRepo().save(updatedPlatform)
    },
    async getOneOrThrow(id: PlatformId): Promise<Platform> {
        const platform = await platformRepo().findOneBy({
            id,
        })

        if (isNil(platform)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'Platform',
                    message: 'Platform not found',
                },
            })
        }

        return platform
    },
    async getOneWithPlan(id: PlatformId): Promise<PlatformWithoutSensitiveData | null> {
        const platform = await this.getOne(id)
        if (isNil(platform)) {
            return null
        }
        return {
            ...platform,
            federatedAuthProviders: stripSensitiveData(platform.federatedAuthProviders),
            usage: await getUsage(log, platform),
            plan: await getPlan(log, platform),
        }
    },
    async getOneWithPlanOrThrow(id: PlatformId): Promise<Omit<PlatformWithoutSensitiveData, 'usage'>> {
        const platform = await this.getOneOrThrow(id)
        return {
            ...platform,
            federatedAuthProviders: stripSensitiveData(platform.federatedAuthProviders),
            plan: await getPlan(log, platform),
        }
    },
    async getOneWithPlanAndUsageOrThrow(id: PlatformId): Promise<PlatformWithoutSensitiveData> {
        const platform = await this.getOneOrThrow(id)
        return {
            ...platform,
            federatedAuthProviders: stripSensitiveData(platform.federatedAuthProviders),
            usage: await getUsage(log, platform),
            plan: await getPlan(log, platform),
        }
    },
    async getOne(id: PlatformId): Promise<Platform | null> {
        return platformRepo().findOneBy({
            id,
        })
    },
})

async function getUsage(_log: FastifyBaseLogger, _platform: Platform): Promise<undefined> {
    return undefined
}

async function getPlan(_log: FastifyBaseLogger, _platform: Platform): Promise<PlatformPlanLimits> {
    return {
        ...OPEN_SOURCE_PLAN,
        stripeSubscriptionStartDate: 0,
        stripeSubscriptionEndDate: 0,
    }
}

function stripSensitiveData(providers: FederatedAuthnProviderConfig): FederatedAuthnProviderConfigWithoutSensitiveData {
    return {
        google: providers.google ? { clientId: providers.google.clientId } : null,
        github: providers.github ? { clientId: providers.github.clientId } : null,
        saml: providers.saml ? {} : null,
    }
}

type AddParams = {
    ownerId: UserId
    name: string
    primaryColor?: string
    logoIconUrl?: string
    fullLogoUrl?: string
    favIconUrl?: string
}

type NewPlatform = Omit<Platform, 'created' | 'updated'>

type UpdateParams = UpdatePlatformRequestBody & {
    id: PlatformId
    plan?: Partial<PlatformPlanLimits>
    logoIconUrl?: string
    fullLogoUrl?: string
    favIconUrl?: string
}

