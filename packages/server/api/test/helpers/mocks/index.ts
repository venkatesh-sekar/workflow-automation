import { LATEST_CONTEXT_VERSION, PieceMetadata } from '@flow/pieces-framework'
import { flowDayjs } from '@flow/server-common'
import {
    AiCreditsAutoTopUpState,
    AIProvider,
    AIProviderName,
    flowId,
    ApiKey,
    AppConnection,
    AppConnectionScope,
    AppConnectionStatus,
    AppConnectionType,
    ApplicationEvent,
    ApplicationEventName,
    assertNotNullOrUndefined,
    Cell,
    ColorName,
    CustomDomain,
    CustomDomainStatus,
    EventDestinationScope,
    Field,
    FieldType,
    File,
    FileCompression,
    FileLocation,
    FileType,
    FilteredPieceBehavior,
    Flow,
    FlowOperationStatus,
    FlowRun,
    FlowRunStatus,
    FlowStatus,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    Folder,
    GitBranchType,
    GitRepo,
    InvitationStatus,
    InvitationType,
    KeyAlgorithm,
    OAuthApp,
    OtpModel,
    OtpState,
    OtpType,
    PackageType,
    PiecesFilterType,
    PieceType,
    Platform,
    PlatformPlan,
    PlatformRole,
    Project,
    ProjectIcon,
    ProjectMember,
    ProjectPlan,
    ProjectRelease,
    ProjectReleaseType,
    ProjectRole,
    ProjectType,
    Record,
    RoleType,
    RunEnvironment,
    SigningKey,
    Table,
    TeamProjectsLimit,
    Template,
    TemplateScope,
    TemplateStatus,
    TemplateType,
    User,
    UserInvitation,
    UserStatus } from '@flow/shared'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { cryptoUtils } from '@flow/server-common'
import { secureFlowId } from '@flow/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderSchema } from '../../../src/app/ai/ai-provider-entity'
import { databaseConnection } from '../../../src/app/database/database-connection'
import { encryptUtils, EncryptedObject } from '../../../src/app/helper/encryption'
import { PieceMetadataSchema } from '../../../src/app/pieces/metadata/piece-metadata-entity'
import { pieceMetadataService } from '../../../src/app/pieces/metadata/piece-metadata-service'
import { PieceTagSchema } from '../../../src/app/pieces/tags/pieces/piece-tag.entity'
import { TagEntitySchema } from '../../../src/app/pieces/tags/tag-entity'

type OAuthAppWithEncryptedSecret = OAuthApp & { clientSecret: EncryptedObject }

const API_KEY_TOKEN_LENGTH = 64
function generateApiKey() {
    const secretValue = secureFlowId(API_KEY_TOKEN_LENGTH - 3)
    const secretKey = `sk-${secretValue}`
    return {
        secret: secretKey,
        secretHashed: cryptoUtils.hashSHA256(secretKey),
        secretTruncated: secretKey.slice(-4),
    }
}

export const CLOUD_PLATFORM_ID = 'cloud-id'

export const createMockUser = (user?: Partial<User>): User => {
    return {
        id: user?.id ?? flowId(),
        created: user?.created ?? faker.date.recent().toISOString(),
        updated: user?.updated ?? faker.date.recent().toISOString(),
        email: user?.email ?? faker.internet.email().toLowerCase().trim(),
        firstName: user?.firstName ?? faker.person.firstName(),
        lastName: user?.lastName ?? faker.person.lastName(),
        status: user?.status ?? UserStatus.ACTIVE,
        verified: user?.verified ?? true,
        tokenVersion: user?.tokenVersion ?? null,
        platformRole: user?.platformRole ?? faker.helpers.enumValue(PlatformRole),
        externalId: user?.externalId,
        platformId: user?.platformId ?? null,
    }
}

export const createMockOAuthApp = async (
    oAuthApp?: Partial<OAuthApp>,
): Promise<OAuthAppWithEncryptedSecret> => {
    return {
        id: oAuthApp?.id ?? flowId(),
        created: oAuthApp?.created ?? faker.date.recent().toISOString(),
        updated: oAuthApp?.updated ?? faker.date.recent().toISOString(),
        platformId: oAuthApp?.platformId ?? flowId(),
        pieceName: oAuthApp?.pieceName ?? faker.lorem.word(),
        clientId: oAuthApp?.clientId ?? flowId(),
        clientSecret: await encryptUtils.encryptString(faker.lorem.word()),
    }
}

export const createMockTemplate = (
    template?: Partial<Template>,
): Template => {
    return {
        id: template?.id ?? flowId(),
        created: template?.created ?? faker.date.recent().toISOString(),
        updated: template?.updated ?? faker.date.recent().toISOString(),
        pieces: template?.pieces ?? [],
        flows: template?.flows ?? [createMockFlowVersion()],
        platformId: template?.platformId ?? flowId(),
        name: template?.name ?? faker.lorem.word(),
        type: template?.type ?? TemplateType.CUSTOM,
        description: template?.description ?? faker.lorem.sentence(),
        summary: template?.summary ?? faker.lorem.sentence(),
        tags: template?.tags ?? [],
        blogUrl: template?.blogUrl ?? faker.internet.url(),
        metadata: template?.metadata ?? null,
        author: template?.author ?? faker.person.fullName(),
        categories: template?.categories ?? [],
        scope: template?.scope ?? TemplateScope.TEAM,
        status: template?.status ?? TemplateStatus.PUBLISHED,
    }
}

export const createMockPlan = (plan?: Partial<ProjectPlan>): ProjectPlan => {
    return {
        id: plan?.id ?? flowId(),
        created: plan?.created ?? faker.date.recent().toISOString(),
        updated: plan?.updated ?? faker.date.recent().toISOString(),
        projectId: plan?.projectId ?? flowId(),
        name: plan?.name ?? faker.lorem.word(),
        locked: plan?.locked ?? false,
        pieces: plan?.pieces ?? [],
        piecesFilterType: plan?.piecesFilterType ?? PiecesFilterType.NONE,
    }
}

export const createMockUserInvitation = (userInvitation: Partial<UserInvitation>): UserInvitation => {
    return {
        id: userInvitation.id ?? flowId(),
        created: userInvitation.created ?? faker.date.recent().toISOString(),
        updated: userInvitation.updated ?? faker.date.recent().toISOString(),
        email: userInvitation.email ?? faker.internet.email(),
        type: userInvitation.type ?? faker.helpers.enumValue(InvitationType),
        platformId: userInvitation.platformId ?? flowId(),
        projectId: userInvitation.projectId,
        projectRole: userInvitation.projectRole,
        platformRole: userInvitation.platformRole,
        status: userInvitation.status ?? faker.helpers.enumValue(InvitationStatus),
    }
}

export const createMockProject = (project?: Partial<Project>): Project => {
    const icon: ProjectIcon = {
        color: faker.helpers.enumValue(ColorName),
    }
    return {
        id: project?.id ?? flowId(),
        created: project?.created ?? faker.date.recent().toISOString(),
        updated: project?.updated ?? faker.date.recent().toISOString(),
        deleted: project?.deleted ?? null,
        ownerId: project?.ownerId ?? flowId(),
        displayName: project?.displayName ?? faker.lorem.word(),
        platformId: project?.platformId ?? flowId(),
        externalId: project?.externalId ?? flowId(),
        releasesEnabled: project?.releasesEnabled ?? false,
        metadata: project?.metadata ?? null,
        type: project?.type ?? ProjectType.TEAM,
        icon,
    }
}

export const createMockGitRepo = (gitRepo?: Partial<GitRepo>): GitRepo => {
    return {
        id: gitRepo?.id ?? flowId(),
        branchType: faker.helpers.enumValue(GitBranchType),
        created: gitRepo?.created ?? faker.date.recent().toISOString(),
        updated: gitRepo?.updated ?? faker.date.recent().toISOString(),
        projectId: gitRepo?.projectId ?? flowId(),
        remoteUrl: gitRepo?.remoteUrl ?? `git@${faker.internet.url()}`,
        sshPrivateKey: gitRepo?.sshPrivateKey ?? faker.internet.password(),
        branch: gitRepo?.branch ?? faker.lorem.word(),
        slug: gitRepo?.slug ?? faker.lorem.word(),
    }
}

export const createMockPlatformPlan = (platformPlan?: Partial<PlatformPlan>): PlatformPlan => {
    return {
        id: platformPlan?.id ?? flowId(),
        created: platformPlan?.created ?? faker.date.recent().toISOString(),
        updated: platformPlan?.updated ?? faker.date.recent().toISOString(),
        platformId: platformPlan?.platformId ?? flowId(),
        tablesEnabled: platformPlan?.tablesEnabled ?? false,
        includedAiCredits: platformPlan?.includedAiCredits ?? 0,
        licenseKey: platformPlan?.licenseKey ?? faker.lorem.word(),
        ssoEnabled: platformPlan?.ssoEnabled ?? false,
        eventStreamingEnabled: platformPlan?.eventStreamingEnabled ?? false,
        aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.DISABLED,
        environmentsEnabled: platformPlan?.environmentsEnabled ?? false,
        analyticsEnabled: platformPlan?.analyticsEnabled ?? false,
        auditLogEnabled: platformPlan?.auditLogEnabled ?? false,
        globalConnectionsEnabled: platformPlan?.globalConnectionsEnabled ?? false,
        customRolesEnabled: platformPlan?.customRolesEnabled ?? false,
        managePiecesEnabled: platformPlan?.managePiecesEnabled ?? false,
        manageTemplatesEnabled: platformPlan?.manageTemplatesEnabled ?? false,
        customAppearanceEnabled: platformPlan?.customAppearanceEnabled ?? false,
        apiKeysEnabled: platformPlan?.apiKeysEnabled ?? false,
        showPoweredBy: platformPlan?.showPoweredBy ?? false,
        embeddingEnabled: platformPlan?.embeddingEnabled ?? false,
        teamProjectsLimit: platformPlan?.teamProjectsLimit ?? TeamProjectsLimit.NONE,
        projectRolesEnabled: platformPlan?.projectRolesEnabled ?? false,
        customDomainsEnabled: platformPlan?.customDomainsEnabled ?? false,
        plan: platformPlan?.plan,
        secretManagersEnabled: platformPlan?.secretManagersEnabled ?? false,
        scimEnabled: platformPlan?.scimEnabled ?? false,
    }
}
export const createMockPlatform = (platform?: Partial<Platform>): Platform => {
    return {
        id: platform?.id ?? flowId(),
        created: platform?.created ?? faker.date.recent().toISOString(),
        updated: platform?.updated ?? faker.date.recent().toISOString(),
        ownerId: platform?.ownerId ?? flowId(),
        enforceAllowedAuthDomains: platform?.enforceAllowedAuthDomains ?? false,
        federatedAuthProviders: platform?.federatedAuthProviders ?? {},
        allowedAuthDomains: platform?.allowedAuthDomains ?? [],
        name: platform?.name ?? faker.lorem.word(),
        primaryColor: platform?.primaryColor ?? faker.color.rgb(),
        logoIconUrl: platform?.logoIconUrl ?? faker.image.urlPlaceholder(),
        fullLogoUrl: platform?.fullLogoUrl ?? faker.image.urlPlaceholder(),
        emailAuthEnabled: platform?.emailAuthEnabled ?? faker.datatype.boolean(),
        pinnedPieces: platform?.pinnedPieces ?? [],
        favIconUrl: platform?.favIconUrl ?? faker.image.urlPlaceholder(),
        filteredPieceNames: platform?.filteredPieceNames ?? [],
        filteredPieceBehavior:
            platform?.filteredPieceBehavior ??
            faker.helpers.enumValue(FilteredPieceBehavior),
        cloudAuthEnabled: platform?.cloudAuthEnabled ?? faker.datatype.boolean(),
    }
}

export const createMockPlatformWithOwner = (
    params?: CreateMockPlatformWithOwnerParams,
): CreateMockPlatformWithOwnerReturn => {
    const mockOwnerId = params?.owner?.id ?? flowId()
    const mockPlatformId = params?.platform?.id ?? flowId()

    const mockOwner = createMockUser({
        ...params?.owner,
        id: mockOwnerId,
        platformId: mockPlatformId,
        platformRole: PlatformRole.ADMIN,
    })

    const mockPlatform = createMockPlatform({
        ...params?.platform,
        id: mockPlatformId,
        ownerId: mockOwnerId,
    })

    return {
        mockPlatform,
        mockOwner,
    }
}

export const createMockProjectMember = (
    projectMember?: Omit<Partial<ProjectMember>, 'projectRoleId'> & {
        projectRoleId: string
    },
): ProjectMember => {
    assertNotNullOrUndefined(projectMember?.userId, 'userId')
    return {
        id: projectMember?.id ?? flowId(),
        created: projectMember?.created ?? faker.date.recent().toISOString(),
        updated: projectMember?.updated ?? faker.date.recent().toISOString(),
        platformId: projectMember?.platformId ?? flowId(),
        projectRoleId: projectMember.projectRoleId,
        userId: projectMember?.userId,
        projectId: projectMember?.projectId ?? flowId(),
    }
}

const MOCK_SIGNING_KEY_PUBLIC_KEY = `-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEAlnd5vGP/1bzcndN/yRD+ZTd6tuemxaJd+12bOZ2QCXcTM03AKSp3
NE5QMyIi13PXMg+z1uPowfivPJ4iVTMaW1U00O7JlUduGR0VrG0BCJlfEf852V71
TfE+2+EpMme9Yw6Gs/YAuOwgVwu3n/XF0il3FTIm1oY1a/MA79rv0RSscnIgCaYJ
e86LWm+H6753Si0MIId/ajIfYYIndN6qRIlPsgagdL+kljUSPEiIzmV0POxTltBo
tXL1t7Mu+meJrY85MXG5W8BS05+q6dJql7Cl0UbPK152ziakB+biMI/4hYlaOIBT
3KeOcz/Jg7Zv21Y0tbdrZ5osVrrNpFsCV7PGyQIUDVmmnCHrOEBS2XM5zOHzTxMl
JQh3Db318rB5415zuBTzrO+20++03kH4SwZEEBg1SDAInYwLOWldbTuZuD0Hx7P2
g4a3OqHHVOcAgtsHgmU7/zCgCIETg4KbRdpSsqOm/YJDWWoLDTwvKnH5QHSBacq1
kxbNAUSuLQESkfZq1Dw5+tdBDJr29bxjmiSggyittTYn1B3iHACNoe4zj9sMQQIf
j9mmntXsa/leIwBVspiEOHYZwJOe5+goSd8K1VIQJxC1DVBxB2eHxMvuo3eyJ0HE
DlebIeZy4zrE1LPgRic1kfdemyxvuN3iwZnPGiY79nL1ZNDM3M4ApSMCAwEAAQ==
-----END RSA PUBLIC KEY-----`

export const createMockApiKey = (
    apiKey?: Partial<Omit<ApiKey, 'hashedValue' | 'truncatedValue'>>,
): ApiKey & { value: string } => {
    const { secretHashed, secretTruncated, secret } = generateApiKey()
    return {
        id: apiKey?.id ?? flowId(),
        created: apiKey?.created ?? faker.date.recent().toISOString(),
        updated: apiKey?.updated ?? faker.date.recent().toISOString(),
        displayName: apiKey?.displayName ?? faker.lorem.word(),
        platformId: apiKey?.platformId ?? flowId(),
        hashedValue: secretHashed,
        value: secret,
        truncatedValue: secretTruncated,
    }
}


export const createMockSigningKey = (
    signingKey?: Partial<SigningKey>,
): SigningKey => {
    return {
        id: signingKey?.id ?? flowId(),
        created: signingKey?.created ?? faker.date.recent().toISOString(),
        updated: signingKey?.updated ?? faker.date.recent().toISOString(),
        displayName: signingKey?.displayName ?? faker.lorem.word(),
        platformId: signingKey?.platformId ?? flowId(),
        publicKey: signingKey?.publicKey ?? MOCK_SIGNING_KEY_PUBLIC_KEY,
        algorithm: signingKey?.algorithm ?? KeyAlgorithm.RSA,
    }
}


export const createMockTag = (tag?: Partial<Omit<TagEntitySchema, 'platform'>>): Omit<TagEntitySchema, 'platform'> => {
    return {
        id: tag?.id ?? flowId(),
        created: tag?.created ?? faker.date.recent().toISOString(),
        updated: tag?.updated ?? faker.date.recent().toISOString(),
        platformId: tag?.platformId ?? flowId(),
        name: tag?.name ?? faker.lorem.word(),
    }
}


export const createMockPieceTag = (request: Partial<Omit<PieceTagSchema, 'platform' | 'tag'>>): Omit<PieceTagSchema, 'platform' | 'tag'> => {
    return {
        id: request.id ?? flowId(),
        created: request.created ?? faker.date.recent().toISOString(),
        updated: request.updated ?? faker.date.recent().toISOString(),
        platformId: request.platformId ?? flowId(),
        pieceName: request.pieceName ?? faker.lorem.word(),
        tagId: request.tagId ?? flowId(),
    }
}

export const createMockPieceMetadata = (
    pieceMetadata?: Partial<Omit<PieceMetadataSchema, 'project'>>,
): Omit<PieceMetadataSchema, 'project'> => {
    return {
        id: pieceMetadata?.id ?? flowId(),
        projectUsage: 0,
        created: pieceMetadata?.created ?? faker.date.recent().toISOString(),
        updated: pieceMetadata?.updated ?? faker.date.recent().toISOString(),
        name: pieceMetadata?.name ?? faker.lorem.word(),
        displayName: pieceMetadata?.displayName ?? faker.lorem.word(),
        logoUrl: pieceMetadata?.logoUrl ?? faker.image.urlPlaceholder(),
        description: pieceMetadata?.description ?? faker.lorem.sentence(),
        directoryPath: pieceMetadata?.directoryPath,
        auth: pieceMetadata?.auth,
        authors: pieceMetadata?.authors ?? [],
        platformId: pieceMetadata?.platformId,
        version: pieceMetadata?.version ?? faker.system.semver(),
        minimumSupportedRelease: pieceMetadata?.minimumSupportedRelease ?? '0.0.0',
        maximumSupportedRelease: pieceMetadata?.maximumSupportedRelease ?? '9.9.9',
        actions: pieceMetadata?.actions ?? {},
        triggers: pieceMetadata?.triggers ?? {},
        pieceType: pieceMetadata?.pieceType ?? faker.helpers.enumValue(PieceType),
        packageType:
            pieceMetadata?.packageType ?? faker.helpers.enumValue(PackageType),
        archiveId: pieceMetadata?.archiveId,
        categories: pieceMetadata?.categories ?? [],
        contextInfo: pieceMetadata?.contextInfo ?? { version: LATEST_CONTEXT_VERSION },
    }
}

export const createAuditEvent = (auditEvent: Partial<ApplicationEvent>) => {
    return {
        id: auditEvent.id ?? flowId(),
        created: auditEvent.created ?? faker.date.recent().toISOString(),
        updated: auditEvent.updated ?? faker.date.recent().toISOString(),
        ip: auditEvent.ip ?? faker.internet.ip(),
        platformId: auditEvent.platformId,
        userId: auditEvent.userId,
        userEmail: auditEvent.userEmail ?? faker.internet.email(),
        action: auditEvent.action ?? faker.helpers.enumValue(ApplicationEventName),
        data: auditEvent.data ?? {},
    }
}

export const createMockCustomDomain = (
    customDomain?: Partial<CustomDomain>,
): CustomDomain => {
    return {
        id: customDomain?.id ?? flowId(),
        created: customDomain?.created ?? faker.date.recent().toISOString(),
        updated: customDomain?.updated ?? faker.date.recent().toISOString(),
        domain: customDomain?.domain ?? faker.internet.domainName(),
        platformId: customDomain?.platformId ?? flowId(),
        status: customDomain?.status ?? faker.helpers.enumValue(CustomDomainStatus),
    }
}

export const createMockOtp = (otp?: Partial<OtpModel>): OtpModel => {
    const now = dayjs()
    const twentyMinutesAgo = now.subtract(5, 'minutes')

    return {
        id: otp?.id ?? flowId(),
        created: otp?.created ?? faker.date.recent().toISOString(),
        updated:
            otp?.updated ??
            faker.date
                .between({ from: twentyMinutesAgo.toDate(), to: now.toDate() })
                .toISOString(),
        type: otp?.type ?? faker.helpers.enumValue(OtpType),
        identityId: otp?.identityId ?? flowId(),
        value:
            otp?.value ?? faker.number.int({ min: 100000, max: 999999 }).toString(),
        state: otp?.state ?? faker.helpers.enumValue(OtpState),
    }
}

export const createMockFlowRun = (flowRun?: Partial<FlowRun>): FlowRun => {
    return {
        id: flowRun?.id ?? flowId(),
        created: flowRun?.created ?? faker.date.recent().toISOString(),
        updated: flowRun?.updated ?? faker.date.recent().toISOString(),
        projectId: flowRun?.projectId ?? flowId(),
        flowId: flowRun?.flowId ?? flowId(),
        tags: flowRun?.tags ?? [],
        steps: {},
        failParentOnFailure: flowRun?.failParentOnFailure ?? false,
        parentRunId: flowRun?.parentRunId ?? undefined,
        flowVersionId: flowRun?.flowVersionId ?? flowId(),
        flowVersion: flowRun?.flowVersion,
        logsFileId: flowRun?.logsFileId ?? null,
        status: flowRun?.status ?? faker.helpers.enumValue(FlowRunStatus),
        startTime: flowRun?.startTime ?? faker.date.recent().toISOString(),
        finishTime: flowRun?.finishTime ?? faker.date.recent().toISOString(),
        environment:
            flowRun?.environment ?? faker.helpers.enumValue(RunEnvironment),
    }
}

export const createMockFlow = (flow?: Partial<Flow>): Flow => {
    return {
        id: flow?.id ?? flowId(),
        created: flow?.created ?? faker.date.recent().toISOString(),
        updated: flow?.updated ?? faker.date.recent().toISOString(),
        projectId: flow?.projectId ?? flowId(),
        status: flow?.status ?? faker.helpers.enumValue(FlowStatus),
        folderId: flow?.folderId ?? null,
        operationStatus: flow?.operationStatus ?? FlowOperationStatus.NONE,
        publishedVersionId: flow?.publishedVersionId ?? null,
        externalId: flow?.externalId ?? flowId(),
    }
}

export const createMockFlowVersion = (
    flowVersion?: Partial<FlowVersion>,
): FlowVersion => {
    const emptyTrigger = {
        type: FlowTriggerType.EMPTY,
        name: 'trigger',
        settings: {},
        valid: false,
        displayName: 'Select Trigger',
        lastUpdatedDate: dayjs().toISOString(),
    } as const

    return {
        id: flowVersion?.id ?? flowId(),
        created: flowVersion?.created ?? faker.date.recent().toISOString(),
        updated: flowVersion?.updated ?? faker.date.recent().toISOString(),
        displayName: flowVersion?.displayName ?? faker.word.words(),
        flowId: flowVersion?.flowId ?? flowId(),
        agentIds: flowVersion?.agentIds ?? [],
        trigger: flowVersion?.trigger ?? emptyTrigger,
        connectionIds: flowVersion?.connectionIds ?? [],
        state: flowVersion?.state ?? faker.helpers.enumValue(FlowVersionState),
        updatedBy: flowVersion?.updatedBy,
        valid: flowVersion?.valid ?? faker.datatype.boolean(),
        notes: flowVersion?.notes ?? [],
    }
}

export const createMockConnection = (connection: Partial<AppConnection>, ownerId: string): AppConnection<AppConnectionType.SECRET_TEXT> => {
    return {
        id: connection?.id ?? flowId(),
        created: connection?.created ?? faker.date.recent().toISOString(),
        updated: connection?.updated ?? faker.date.recent().toISOString(),
        platformId: connection?.platformId ?? flowId(),
        projectIds: connection?.projectIds ?? [],
        pieceName: connection?.pieceName ?? faker.lorem.word(),
        displayName: connection?.displayName ?? faker.lorem.word(),
        type: AppConnectionType.SECRET_TEXT,
        scope: AppConnectionScope.PROJECT,
        status: AppConnectionStatus.ACTIVE,
        ownerId,
        value: {
            type: AppConnectionType.SECRET_TEXT,
            secret_text: faker.lorem.word(),
        },
        metadata: connection?.metadata ?? {},
        externalId: connection?.externalId ?? flowId(),
        owner: null,
        pieceVersion: connection?.pieceVersion ?? '0.0.0',
        preSelectForNewProjects: connection?.preSelectForNewProjects ?? false,
    }
}

export const createMockTable = ({ projectId }: { projectId: string }): Table => {
    return {
        id: flowId(),
        created: faker.date.recent().toISOString(),
        updated: faker.date.recent().toISOString(),
        projectId,
        externalId: flowId(),
        name: faker.lorem.word(),
    }
}

export const createMockField = ({ tableId, projectId }: { tableId: string, projectId: string }): Field => {
    return {
        id: flowId(),
        created: faker.date.recent().toISOString(),
        updated: faker.date.recent().toISOString(),
        tableId,
        name: faker.lorem.word(),
        data: {
            options: [],
        },
        externalId: flowId(),
        projectId,
        type: FieldType.STATIC_DROPDOWN,
    }
}
export const createMockRecord = ({ tableId, projectId }: { tableId: string, projectId: string }): Record => {
    return {
        id: flowId(),
        created: faker.date.recent().toISOString(),
        updated: faker.date.recent().toISOString(),
        tableId,
        projectId,
    }
}

export const createMockCell = ({ recordId, fieldId, projectId }: { recordId: string, fieldId: string, projectId: string }): Cell => {
    return {
        id: flowId(),
        created: faker.date.recent().toISOString(),
        updated: faker.date.recent().toISOString(),
        recordId,
        fieldId,
        projectId,
        value: faker.lorem.word(),
    }
}


type Solution = {
    table: Table
    connection: AppConnection<AppConnectionType.SECRET_TEXT>
    flow: Flow
    flowRun: FlowRun
    flowVersion: FlowVersion
    cell: Cell
}

export const createMockSolutionAndSave = async ({ projectId, platformId, userId }: { projectId: string, platformId: string, userId: string }): Promise<Solution> => {
    const table = createMockTable({ projectId })
    const field = createMockField({ tableId: table.id, projectId })
    const record = createMockRecord({ tableId: table.id, projectId })
    const cell = createMockCell({ recordId: record.id, fieldId: field.id, projectId })
    const connection = createMockConnection({ projectIds: [projectId], platformId }, userId)
    const flow = createMockFlow({ projectId })
    const flowVersion = createMockFlowVersion({ flowId: flow.id })
    const flowRun = createMockFlowRun({ projectId, flowId: flow.id, flowVersionId: flowVersion.id })
    await databaseConnection().getRepository('table').save([table])
    await databaseConnection().getRepository('field').save([field])
    await databaseConnection().getRepository('record').save([record])
    await databaseConnection().getRepository('cell').save([cell])
    await databaseConnection().getRepository('app_connection').save([connection])
    await databaseConnection().getRepository('flow').save([flow])
    await databaseConnection().getRepository('flow_version').save([flowVersion])
    await databaseConnection().getRepository('flow_run').save([flowRun])
    return { table, connection, flow, flowRun, flowVersion, cell }
}

export const checkIfSolutionExistsInDb = async (solution: Solution): Promise<boolean> => {
    const table = await databaseConnection().getRepository('table').findOneBy({ id: solution.table.id })
    const connection = await databaseConnection().getRepository('app_connection').findOneBy({ id: solution.connection.id })
    const flow = await databaseConnection().getRepository('flow').findOneBy({ id: solution.flow.id })
    const flowRun = await databaseConnection().getRepository('flow_run').findOneBy({ id: solution.flowRun.id })
    const flowVersion = await databaseConnection().getRepository('flow_version').findOneBy({ id: solution.flowVersion.id })
    const cell = await databaseConnection().getRepository('cell').findOneBy({ id: solution.cell.id })
    return table !== null && connection !== null && flow !== null && flowRun !== null && flowVersion !== null && cell !== null
}
export const mockBasicUser = async ({ user }: { userIdentity?: unknown, user?: Partial<User> }) => {
    const mockUser = createMockUser({
        verified: true,
        ...user,
    })
    await databaseConnection().getRepository('user').save(mockUser)
    return {
        mockUser,
    }
}
export const mockAndSaveBasicSetup = async (params?: MockBasicSetupParams): Promise<MockBasicSetup> => {
    const mockOwner = createMockUser({
        ...params?.user,
        verified: true,
        platformRole: PlatformRole.ADMIN,
    })
    await databaseConnection().getRepository('user').save(mockOwner)

    const mockPlatform = createMockPlatform({
        ...params?.platform,
        ownerId: mockOwner.id,
        filteredPieceBehavior: params?.platform?.filteredPieceBehavior ?? FilteredPieceBehavior.BLOCKED,
    })

    await databaseConnection().getRepository('platform').save(mockPlatform)

    mockOwner.platformId = mockPlatform.id
    await databaseConnection().getRepository('user').save(mockOwner)

    const mockProject = createMockProject({
        ...params?.project,
        ownerId: mockOwner.id,
        platformId: mockPlatform.id,
    })
    await databaseConnection().getRepository('project').save(mockProject)

    return {
        mockOwner,
        mockPlatform,
        mockProject,
    }
}

type MockBasicSetupWithApiKey = MockBasicSetup & { mockApiKey: ApiKey & { value: string } }
export const mockAndSaveBasicSetupWithApiKey = async (params?: MockBasicSetupParams): Promise<MockBasicSetupWithApiKey> => {
    const basicSetup = await mockAndSaveBasicSetup(params)

    const mockApiKey = createMockApiKey({
        platformId: basicSetup.mockPlatform.id,
    })
    await databaseConnection().getRepository('api_key').save(mockApiKey)

    return {
        ...basicSetup,
        mockApiKey,
    }
}

export const createMockFile = (file?: Partial<File>): File => {
    return {
        id: file?.id ?? flowId(),
        created: file?.created ?? faker.date.recent().toISOString(),
        updated: file?.updated ?? faker.date.recent().toISOString(),
        platformId: file?.platformId ?? flowId(),
        projectId: file?.projectId ?? flowId(),
        location: file?.location ?? FileLocation.DB,
        compression: file?.compression ?? faker.helpers.enumValue(FileCompression),
        data: file?.data ?? Buffer.from(faker.lorem.paragraphs()),
        type: file?.type ?? faker.helpers.enumValue(FileType),
    }
}

export const createMockProjectRole = (projectRole?: Partial<ProjectRole>): ProjectRole => {
    return {
        id: projectRole?.id ?? flowId(),
        name: projectRole?.name ?? faker.lorem.word(),
        created: projectRole?.created ?? faker.date.recent().toISOString(),
        updated: projectRole?.updated ?? faker.date.recent().toISOString(),
        permissions: projectRole?.permissions ?? [],
        platformId: projectRole?.platformId ?? flowId(),
        type: projectRole?.type ?? faker.helpers.enumValue(RoleType),
    }
}

export const createMockProjectRelease = (projectRelease?: Partial<ProjectRelease>): ProjectRelease => {
    return {
        id: projectRelease?.id ?? flowId(),
        created: projectRelease?.created ?? faker.date.recent().toISOString(),
        updated: projectRelease?.updated ?? faker.date.recent().toISOString(),
        projectId: projectRelease?.projectId ?? flowId(),
        importedBy: projectRelease?.importedBy ?? flowId(),
        fileId: projectRelease?.fileId ?? flowId(),
        name: projectRelease?.name ?? faker.lorem.word(),
        description: projectRelease?.description ?? faker.lorem.sentence(),
        type: projectRelease?.type ?? faker.helpers.enumValue(ProjectReleaseType),
    }
}

export const createMockAIProvider = async (aiProvider?: Partial<AIProvider>): Promise<Omit<AIProviderSchema, 'platform'>> => {
    return {
        id: aiProvider?.id ?? flowId(),
        created: aiProvider?.created ?? faker.date.recent().toISOString(),
        updated: aiProvider?.updated ?? faker.date.recent().toISOString(),
        platformId: aiProvider?.platformId ?? flowId(),
        provider: aiProvider?.provider ?? faker.helpers.enumValue(AIProviderName),
        displayName: aiProvider?.displayName ?? faker.lorem.word(),
        auth: await encryptUtils.encryptObject({
            apiKey: process.env.OPENAI_API_KEY ?? faker.string.uuid(),
        }),
        config: {},
    }
    
}

export const mockAndSaveAIProvider = async (params?: Partial<AIProvider>): Promise<Omit<AIProviderSchema, 'platform'>> => {
    const mockAIProvider = await createMockAIProvider(params)
    await databaseConnection().getRepository('ai_provider').upsert(mockAIProvider, ['platformId', 'provider'])
    return mockAIProvider
}

export const mockPieceMetadata = async (mockLog: FastifyBaseLogger): Promise<PieceMetadata> => {
    const { mockPlatform } = await mockAndSaveBasicSetup()
    const mockPieceMetadata = createMockPieceMetadata({
        platformId: mockPlatform.id,
        packageType: PackageType.REGISTRY,
    })
    await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])
    pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPieceMetadata)
    return mockPieceMetadata
}

export const createMockFolder = (folder?: Partial<Folder>): Folder => {
    return {
        id: folder?.id ?? flowId(),
        created: folder?.created ?? faker.date.recent().toISOString(),
        updated: folder?.updated ?? faker.date.recent().toISOString(),
        projectId: folder?.projectId ?? flowId(),
        displayName: folder?.displayName ?? faker.lorem.word(),
        displayOrder: folder?.displayOrder ?? faker.number.int({ min: 0, max: 100 }),
    }
}

export const createMockEventDestination = (eventDestination?: Partial<{
    id: string
    created: string
    updated: string
    platformId: string
    events: ApplicationEventName[]
    url: string
    scope: EventDestinationScope
}>): {
    id: string
    created: string
    updated: string
    platformId: string
    events: ApplicationEventName[]
    url: string
    scope: EventDestinationScope
} => {
    return {
        id: eventDestination?.id ?? flowId(),
        created: eventDestination?.created ?? faker.date.recent().toISOString(),
        updated: eventDestination?.updated ?? faker.date.recent().toISOString(),
        platformId: eventDestination?.platformId ?? flowId(),
        events: eventDestination?.events ?? [faker.helpers.enumValue(ApplicationEventName)],
        url: eventDestination?.url ?? faker.internet.url(),
        scope: eventDestination?.scope ?? EventDestinationScope.PLATFORM,
    }
}

type CreateMockPlatformWithOwnerParams = {
    platform?: Partial<Omit<Platform, 'ownerId'>>
    owner?: Partial<Omit<User, 'platformId'>>
}

type CreateMockPlatformWithOwnerReturn = {
    mockPlatform: Platform
    mockOwner: User
}


type MockBasicSetup = {
    mockOwner: User
    mockPlatform: Platform
    mockProject: Project
}

type MockBasicSetupParams = {
    user?: Partial<User>
    plan?: Partial<PlatformPlan>
    platform?: Partial<Platform>
    project?: Partial<Project>
}
