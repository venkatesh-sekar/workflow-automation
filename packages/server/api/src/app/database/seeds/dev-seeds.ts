import { AppSystemProp } from '@activepieces/server-common'
import {
    apId,
    isNil,
    PlatformRole,
    ProjectType,
} from '@activepieces/shared'
import crypto from 'crypto'
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

    // Create admin user
    const adminUser = await userService(log).create({
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
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

    // Create personal project for admin
    await projectService(log).create({
        displayName: 'Admin\'s Project',
        ownerId: adminUser.id,
        platformId: platform.id,
        type: ProjectType.PERSONAL,
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

export const devDataSeed: DataSeed = {
    run: seedAdminFromEnv,
}
