const fs = require('fs')
const path = require('path')

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'redis-memory-server',
  'lib',
  'util',
  'RedisBinaryDownload.js',
)

if (!fs.existsSync(filePath)) {
  process.exit(0)
}

const content = fs.readFileSync(filePath, 'utf8')
if (content.includes('JEMALLOC_CONFIGURE_OPTS')) {
  const patched = content.replace(
    "'JEMALLOC_CONFIGURE_OPTS=--with-lg-vaddr=48'",
    "'MALLOC=libc'",
  )
  fs.writeFileSync(filePath, patched)
}
