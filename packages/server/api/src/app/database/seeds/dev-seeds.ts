import { AppSystemProp } from '@activepieces/server-common'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { DataSeed } from './data-seed'

const log = system.globalLogger()

const seedDevData = async (): Promise<void> => {
    const env = system.get(AppSystemProp.ENVIRONMENT)
    const edition = system.get(AppSystemProp.EDITION)
    if (env !== ApEnvironment.DEVELOPMENT || edition === ApEdition.ENTERPRISE) {
        log.info('[devSeeds#seedDevData] Skipping, not in development environment')
        return
    }
    // Flow uses team-login with API keys — dev user seeding handled by CLI scripts (create-team, add-member)
    log.info('[devSeeds#seedDevData] No-op in Flow — use CLI scripts to create teams and members')
}

export const devDataSeed: DataSeed = {
    run: seedDevData,
}
