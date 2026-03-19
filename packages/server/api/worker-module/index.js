// worker-stub is bundled into dist/main.js by esbuild
// This shim is only used in development (tsx watch mode)
try {
    module.exports = require('../dist/src/app/helper/worker-stub');
} catch {
    module.exports = {};
}
