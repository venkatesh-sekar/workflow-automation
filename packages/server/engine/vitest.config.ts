import path from 'path'
import { defineConfig } from 'vitest/config'

// Change CWD to repo root for compatibility with piece-loader path resolution
const repoRoot = path.resolve(__dirname, '../../..')
process.chdir(repoRoot)

process.env.FLOW_EXECUTION_MODE = 'UNSANDBOXED'
process.env.FLOW_BASE_CODE_DIRECTORY = 'packages/server/engine/test/resources/codes'
process.env.FLOW_TEST_MODE = 'true'
process.env.FLOW_DEV_PIECES = 'http,data-mapper,approval,webhook'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    include: [path.resolve(__dirname, 'test/**/*.test.ts')],
  },
  resolve: {
    alias: {
      '@activepieces/shared': path.resolve(__dirname, '../../../packages/shared/src/index.ts'),
      '@activepieces/pieces-framework': path.resolve(__dirname, '../../../packages/pieces/framework/src/index.ts'),
      '@activepieces/pieces-common': path.resolve(__dirname, '../../../packages/pieces/common/src/index.ts'),
    },
  },
})
