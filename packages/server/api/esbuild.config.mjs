import * as esbuild from 'esbuild'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/bootstrap.ts')],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: path.resolve(__dirname, 'dist/main.js'),
    format: 'cjs',
    sourcemap: true,
    // Resolve packages from server/api node_modules even when source is in sibling dirs
    nodePaths: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '../../../node_modules'),
    ],
    alias: {
        '@flow/shared': path.resolve(__dirname, '../../shared/src'),
        '@flow/pieces-framework': path.resolve(__dirname, '../../pieces/framework/src'),
        '@flow/pieces-common': path.resolve(__dirname, '../../pieces/common/src'),
        '@flow/piece-registry': path.resolve(__dirname, '../../pieces/registry.ts'),
        '@flow/server-common': path.resolve(__dirname, '../common/src'),
        '@flow/engine': path.resolve(__dirname, '../engine/src/main.ts'),
        'worker': path.resolve(__dirname, 'src/app/helper/worker-stub.ts'),
    },
    // Keep all npm packages external — only bundle @flow/* source code.
    // Runtime resolution handled via NODE_PATH in the entrypoint.
    packages: 'external',
})
