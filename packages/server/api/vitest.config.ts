import path from 'path'
import { defineConfig } from 'vitest/config'

// Change CWD to repo root for compatibility with piece-loader path resolution
const repoRoot = path.resolve(__dirname, '../../..')
process.chdir(repoRoot)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: 'forks',
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    include: [path.resolve(__dirname, 'test/**/*.test.ts')],
  },
  resolve: {
    alias: {
      'isolated-vm': path.resolve(__dirname, '__mocks__/isolated-vm.js'),
      '@flow/shared': path.resolve(__dirname, '../../../packages/shared/src/index.ts'),
      '@flow/pieces-framework': path.resolve(__dirname, '../../../packages/pieces/framework/src/index.ts'),
      '@flow/pieces-common': path.resolve(__dirname, '../../../packages/pieces/common/src/index.ts'),
      '@flow/server-common': path.resolve(__dirname, '../../../packages/server/common/src/index.ts'),
      '@flow/sandbox': path.resolve(__dirname, '../../../packages/server/sandbox/src/index.ts'),
      'worker': path.resolve(__dirname, 'src/app/helper/worker-stub.ts'),
    },
  },
})
