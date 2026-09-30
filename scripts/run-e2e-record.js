#!/usr/bin/env node

const { spawnPnpmSync } = require('./pnpm-runner')

const extraArgs = process.argv.slice(2)

if (extraArgs.length === 0) {
  console.error('[E2E] Recording requires an explicit target. Example:')
  console.error('  pnpm test:e2e:record -- tests/e2e/test/image-image2image-generate.spec.ts')
  process.exit(1)
}

const result = spawnPnpmSync(['exec', 'playwright', 'test', ...extraArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    E2E_VCR_MODE: 'record'
  }
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 0)
