/**
 * CLI script: add-member
 *
 * Adds a user (by email) to an existing team/project.
 *
 * Usage:
 *   npx tsx packages/server/api/src/app/cli/add-member.ts --project-id <id> --email user@example.com
 *
 * Options:
 *   --project-id    Project/team ID (required)
 *   --email         Member email (required)
 *   --first-name    First name (default: "Team")
 *   --last-name     Last name (default: "Member")
 */

import crypto from 'crypto'
import pino from 'pino'
import { apId, PlatformRole, Permission, RoleType, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { projectRepo } from '../project/project-service'
import { userRepo } from '../user/user-service'
import { userIdentityRepository } from '../authentication/user-identity/user-identity-service'

const log = pino({ level: 'warn' })

function parseArgs(): { projectId: string, email: string, firstName: string, lastName: string } {
    const args = process.argv.slice(2)
    let projectId = ''
    let email = ''
    let firstName = 'Team'
    let lastName = 'Member'

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--project-id':
                projectId = args[++i]
                break
            case '--email':
                email = args[++i]
                break
            case '--first-name':
                firstName = args[++i]
                break
            case '--last-name':
                lastName = args[++i]
                break
        }
    }

    if (!projectId) {
        console.error('Error: --project-id is required')
        process.exit(1)
    }
    if (!email) {
        console.error('Error: --email is required')
        process.exit(1)
    }

    return { projectId, email: email.toLowerCase().trim(), firstName, lastName }
}

async function getOrCreateIdentity(email: string, firstName: string, lastName: string): Promise<string> {
    const existing = await userIdentityRepository().findOne({ where: { email } })
    if (existing) {
        return existing.id
    }

    const identityId = apId()
    await userIdentityRepository().save({
        id: identityId,
        email,
        firstName,
        lastName,
        password: 'NOLOGIN',
        provider: UserIdentityProvider.EMAIL,
        verified: true,
        trackEvents: false,
        newsLetter: false,
        tokenVersion: crypto.randomUUID(),
        imageUrl: null,
    })
    return identityId
}

async function getOrCreateUser(identityId: string, platformId: string): Promise<string> {
    const existing = await userRepo().findOne({
        where: { identityId, platformId },
    })
    if (existing) {
        return existing.id
    }

    const userId = apId()
    await userRepo().save({
        id: userId,
        identityId,
        platformId,
        platformRole: PlatformRole.MEMBER,
        status: UserStatus.ACTIVE,
        externalId: null,
    })
    return userId
}

const ALL_MEMBER_PERMISSIONS = Object.values(Permission)

async function getOrCreateDefaultRole(platformId: string): Promise<string> {
    const ds = databaseConnection()
    const existing = await ds.query(
        `SELECT id FROM project_role WHERE "platformId" = $1 AND "name" = 'MEMBER' AND "type" = $2 LIMIT 1`,
        [platformId, RoleType.DEFAULT],
    )
    if (existing.length > 0) {
        return existing[0].id
    }

    const roleId = apId()
    const now = new Date().toISOString()
    await ds.query(
        `INSERT INTO project_role (id, created, updated, name, permissions, "platformId", type) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [roleId, now, now, 'MEMBER', ALL_MEMBER_PERMISSIONS, platformId, RoleType.DEFAULT],
    )
    return roleId
}

async function addProjectMember(projectId: string, platformId: string, userId: string, roleId: string): Promise<void> {
    const ds = databaseConnection()
    const existing = await ds.query(
        `SELECT id FROM project_member WHERE "projectId" = $1 AND "userId" = $2 AND "platformId" = $3 LIMIT 1`,
        [projectId, userId, platformId],
    )
    if (existing.length > 0) {
        console.log('User is already a member of this project')
        return
    }

    const memberId = apId()
    const now = new Date().toISOString()
    await ds.query(
        `INSERT INTO project_member (id, created, updated, "projectId", "platformId", "userId", "projectRoleId") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [memberId, now, now, projectId, platformId, userId, roleId],
    )
}

async function main(): Promise<void> {
    const { projectId, email, firstName, lastName } = parseArgs()

    await databaseConnection().initialize()

    const project = await projectRepo().findOneBy({ id: projectId })
    if (!project) {
        console.error(`Error: project ${projectId} not found`)
        process.exit(1)
    }

    const identityId = await getOrCreateIdentity(email, firstName, lastName)
    const userId = await getOrCreateUser(identityId, project.platformId)
    const roleId = await getOrCreateDefaultRole(project.platformId)
    await addProjectMember(projectId, project.platformId, userId, roleId)

    console.log(JSON.stringify({
        projectId,
        teamName: project.displayName,
        email,
        userId,
        status: 'added',
    }, null, 2))

    await databaseConnection().destroy()
}

main().catch((err) => {
    console.error('Failed to add member:', err)
    process.exit(1)
})
