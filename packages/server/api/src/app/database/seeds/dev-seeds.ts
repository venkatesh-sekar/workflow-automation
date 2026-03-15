import { AppSystemProp } from '@activepieces/server-common'
import {
    apId,
    isNil,
    PlatformRole,
    ProjectType,
    UserIdentityProvider,
} from '@activepieces/shared'
import crypto from 'crypto'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { system } from '../../helper/system/system'
import { DataSeed } from './data-seed'

const log = system.globalLogger()

const seedAdminFromEnv = async (): Promise<void> => {
    const adminEmail = system.get(AppSystemProp.ADMIN_EMAIL)
    const adminApiKey = system.get(AppSystemProp.ADMIN_API_KEY)

    if (isNil(adminEmail) || isNil(adminApiKey)) {
        log.info('[bootstrap] FLOW_ADMIN_EMAIL or FLOW_ADMIN_API_KEY not set — skipping bootstrap')
        return
    }

    // Check if any platform exists — if so, already bootstrapped
    const existingPlatforms = await import('../../platform/platform.service').then(m => m.platformRepo().find({ take: 1 }))
    if (existingPlatforms.length > 0) {
        log.info('[bootstrap] Platform already exists — skipping bootstrap')
        return
    }

    log.info({ email: adminEmail }, '[bootstrap] Creating admin platform, user, and team project')

    // Create user identity first
    const identity = await userIdentityService(log).create({
        email: adminEmail,
        password: crypto.randomBytes(32).toString('hex'),
        firstName: 'Admin',
        lastName: 'User',
        trackEvents: false,
        newsLetter: false,
        provider: UserIdentityProvider.EMAIL,
        verified: true,
    })

    // Create admin user linked to identity
    const adminUser = await userService(log).create({
        identityId: identity.id,
        platformId: null,
        platformRole: PlatformRole.ADMIN,
    })

    // Create platform
    const platform = await platformService(log).create({
        ownerId: adminUser.id,
        name: 'Flow',
    })

    // Update user with platform ID
    await userService(log).addOwnerToPlatform({
        id: adminUser.id,
        platformId: platform.id,
    })

    // Create team project with API key
    const apiKeyHash = crypto.createHash('sha256').update(adminApiKey).digest('hex')
    const teamProject = await projectService(log).create({
        displayName: 'Default Team',
        ownerId: adminUser.id,
        platformId: platform.id,
        type: ProjectType.TEAM,
        apiKeyHash,
    })

    // Set USER_CREATED flag
    const { FlagEntity } = await import('../../flags/flag.entity')
    const { databaseConnection } = await import('../database-connection')
    await databaseConnection().getRepository(FlagEntity).save({
        id: 'USER_CREATED',
        value: true,
    })

    log.info({
        email: adminEmail,
        platformId: platform.id,
        teamProjectId: teamProject.id,
    }, '[bootstrap] Admin bootstrapped successfully. Use FLOW_ADMIN_API_KEY + email to log in.')
}

const migratePersonalProjectsToTeam = async (): Promise<void> => {
    const { databaseConnection } = await import('../database-connection')
    const { projectRepo } = await import('../../project/project-service')

    // Convert all PERSONAL projects to TEAM
    const result = await projectRepo().createQueryBuilder()
        .update()
        .set({ type: ProjectType.TEAM })
        .where('type = :type', { type: 'PERSONAL' })
        .execute()

    if (result.affected && result.affected > 0) {
        log.info({ count: result.affected }, '[migration] Converted PERSONAL projects to TEAM')

        // Ensure owners of converted projects are in project_member table
        await databaseConnection().query(`
            INSERT INTO project_member ("id", "userId", "projectId", "platformId", "projectRoleId", "created", "updated")
            SELECT
                gen_random_uuid(),
                p."ownerId",
                p.id,
                p."platformId",
                (SELECT id FROM project_role WHERE name = 'Admin' AND "platformId" = p."platformId" LIMIT 1),
                NOW(),
                NOW()
            FROM project p
            WHERE p."ownerId" IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM project_member pm WHERE pm."userId" = p."ownerId" AND pm."projectId" = p.id
            )
        `)
    }
}

export const devDataSeed: DataSeed = {
    run: async () => {
        await seedAdminFromEnv()
        await migratePersonalProjectsToTeam()
    },
}
