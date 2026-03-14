import { system } from '../../helper/system/system'
import { DataSeed } from './data-seed'

// Role seeding removed — ProjectRoleEntity was EE-only.
// Will be reimplemented with Flow's own auth system in auth-replace phase.
export const rolesSeed: DataSeed = {
    run: async () => {
        system.globalLogger().info({ name: 'rolesSeed' }, 'Skipping role seed (Flow uses team-based auth)')
    },
}
