/**
 * CLI script: create-team
 *
 * Creates a new team (project) with an API key for team-login authentication.
 *
 * Usage:
 *   npx tsx packages/server/api/src/app/cli/create-team.ts --name "My Team" --owner-email admin@example.com
 *
 * Options:
 *   --name          Team/project display name (required)
 *   --owner-email   Email for the team owner (required)
 *   --owner-first   Owner first name (default: "Admin")
 *   --owner-last    Owner last name (default: "User")
 */

import crypto from 'crypto'
import pino from 'pino'
import { apId, ColorName, PlatformRole, ProjectType, UserStatus } from '@flow/shared'
import { databaseConnection } from '../database/database-connection'
import { projectRepo } from '../project/project-service'
import { userRepo } from '../user/user-service'
import { platformRepo } from '../platform/platform.service'
import { defaultTheme } from '../flags/theme'
import { FilteredPieceBehavior } from '@flow/shared'

const log = pino({ level: 'warn' })

function parseArgs(): { name: string, ownerEmail: string, ownerFirst: string, ownerLast: string } {
    const args = process.argv.slice(2)
    let name = ''
    let ownerEmail = ''
    let ownerFirst = 'Admin'
    let ownerLast = 'User'

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--name':
                name = args[++i]
                break
            case '--owner-email':
                ownerEmail = args[++i]
                break
            case '--owner-first':
                ownerFirst = args[++i]
                break
            case '--owner-last':
                ownerLast = args[++i]
                break
        }
    }

    if (!name) {
        console.error('Error: --name is required')
        process.exit(1)
    }
    if (!ownerEmail) {
        console.error('Error: --owner-email is required')
        process.exit(1)
    }

    return { name, ownerEmail: ownerEmail.toLowerCase().trim(), ownerFirst, ownerLast }
}

async function getOrCreateDefaultPlatform(ownerId: string): Promise<string> {
    const platforms = await platformRepo().find()
    if (platforms.length > 0) {
        return platforms[0].id
    }

    const platformId = apId()
    await platformRepo().save({
        id: platformId,
        ownerId,
        name: 'Flow',
        primaryColor: defaultTheme.colors.primary.default,
        logoIconUrl: defaultTheme.logos.logoIconUrl,
        fullLogoUrl: defaultTheme.logos.fullLogoUrl,
        favIconUrl: defaultTheme.logos.favIconUrl,
        emailAuthEnabled: true,
        filteredPieceNames: [],
        enforceAllowedAuthDomains: false,
        allowedAuthDomains: [],
        filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
        federatedAuthProviders: {},
        cloudAuthEnabled: true,
        pinnedPieces: [],
    })
    return platformId
}

async function getOrCreateUser(email: string, firstName: string, lastName: string, platformId: string): Promise<string> {
    const existing = await userRepo().findOne({
        where: { email, platformId },
    })
    if (existing) {
        return existing.id
    }

    const userId = apId()
    await userRepo().save({
        id: userId,
        email,
        firstName,
        lastName,
        verified: true,
        tokenVersion: crypto.randomUUID(),
        platformId,
        platformRole: PlatformRole.ADMIN,
        status: UserStatus.ACTIVE,
        externalId: null,
    })
    return userId
}

function generateApiKey(): { plaintext: string, hash: string } {
    const plaintext = `flow_${crypto.randomBytes(32).toString('hex')}`
    const hash = crypto.createHash('sha256').update(plaintext).digest('hex')
    return { plaintext, hash }
}

async function main(): Promise<void> {
    const { name, ownerEmail, ownerFirst, ownerLast } = parseArgs()

    await databaseConnection().initialize()

    // Create user with placeholder platformId, then create/get platform
    const userId = await getOrCreateUser(ownerEmail, ownerFirst, ownerLast, 'placeholder')
    const platformId = await getOrCreateDefaultPlatform(userId)

    // Update user's platformId if we just created the platform
    await userRepo().update({ id: userId }, { platformId })

    const { plaintext, hash } = generateApiKey()

    const projectId = apId()
    await projectRepo().save({
        id: projectId,
        ownerId: userId,
        displayName: name,
        type: ProjectType.TEAM,
        platformId,
        apiKeyHash: hash,
        icon: {
            color: ColorName.RED,
        },
        releasesEnabled: false,
        externalId: null,
        maxConcurrentJobs: null,
        metadata: null,
    })

    console.log(JSON.stringify({
        projectId,
        teamName: name,
        ownerEmail,
        apiKey: plaintext,
    }, null, 2))

    await databaseConnection().destroy()
}

main().catch((err) => {
    console.error('Failed to create team:', err)
    process.exit(1)
})
