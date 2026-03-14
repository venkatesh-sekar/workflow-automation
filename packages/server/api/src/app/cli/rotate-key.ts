/**
 * CLI script: rotate-key
 *
 * Generates a new API key for an existing project/team.
 * Existing user sessions remain valid until their JWTs expire.
 *
 * Usage:
 *   npx tsx packages/server/api/src/app/cli/rotate-key.ts --project-id <id>
 *
 * Options:
 *   --project-id   The project ID to rotate the key for (required)
 */

import crypto from 'crypto'
import { databaseConnection } from '../database/database-connection'
import { projectRepo } from '../project/project-service'

function parseArgs(): { projectId: string } {
    const args = process.argv.slice(2)
    let projectId = ''

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--project-id') {
            projectId = args[++i]
        }
    }

    if (!projectId) {
        console.error('Error: --project-id is required')
        process.exit(1)
    }

    return { projectId }
}

function generateApiKey(): { plaintext: string, hash: string } {
    const plaintext = `flow_${crypto.randomBytes(32).toString('hex')}`
    const hash = crypto.createHash('sha256').update(plaintext).digest('hex')
    return { plaintext, hash }
}

async function main(): Promise<void> {
    const { projectId } = parseArgs()

    await databaseConnection().initialize()

    const project = await projectRepo().findOneBy({ id: projectId })
    if (!project) {
        console.error(`Error: project not found with id "${projectId}"`)
        await databaseConnection().destroy()
        process.exit(1)
    }

    const { plaintext, hash } = generateApiKey()

    await projectRepo().update({ id: projectId }, { apiKeyHash: hash })

    console.log(JSON.stringify({
        projectId,
        teamName: project.displayName,
        apiKey: plaintext,
    }, null, 2))

    await databaseConnection().destroy()
}

main().catch((err) => {
    console.error('Failed to rotate key:', err)
    process.exit(1)
})
