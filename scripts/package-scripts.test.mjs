import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8'))

test('root lint includes isolated UI consumer checks plus existing package lint/typechecks', () => {
  const rootPackage = readJson('package.json')

  assert.equal(typeof rootPackage.scripts?.lint, 'string')
  assert.match(rootPackage.scripts.lint, /\blint:ui\b/)
  assert.match(rootPackage.scripts.lint, /\btypecheck:ui\b/)
  assert.match(rootPackage.scripts.lint, /\blint:mcp-server\b/)
  assert.match(rootPackage.scripts.lint, /\btypecheck:core\b/)
  assert.match(rootPackage.scripts.lint, /\btypecheck:mcp-server\b/)
  assert.match(rootPackage.scripts.lint, /\bbuild:ui-types\b/)
  assert.match(rootPackage.scripts.lint, /\btypecheck:web\b/)
  assert.match(rootPackage.scripts.lint, /\btypecheck:extension\b/)
  assert.equal(typeof rootPackage.scripts?.['lint:ui'], 'string')
  assert.equal(typeof rootPackage.scripts?.['typecheck:ui'], 'string')
  assert.equal(typeof rootPackage.scripts?.['lint:mcp-server'], 'string')
  assert.equal(typeof rootPackage.scripts?.['typecheck:core'], 'string')
  assert.equal(typeof rootPackage.scripts?.['typecheck:mcp-server'], 'string')
  assert.equal(typeof rootPackage.scripts?.['build:ui-types'], 'string')
  assert.equal(typeof rootPackage.scripts?.['typecheck:web'], 'string')
  assert.equal(typeof rootPackage.scripts?.['typecheck:extension'], 'string')
})

test('repo checks execute package script coverage tests', () => {
  const rootPackage = readJson('package.json')

  assert.equal(typeof rootPackage.scripts?.['test:repo'], 'string')
  assert.match(rootPackage.scripts['test:repo'], /scripts\/package-scripts\.test\.mjs/)
})

test('core package exposes a dedicated typecheck script', () => {
  const corePackage = readJson(path.join('packages', 'core', 'package.json'))

  assert.equal(typeof corePackage.scripts?.typecheck, 'string')
  assert.match(corePackage.scripts.typecheck, /\btsc\b/)
  assert.match(corePackage.scripts.typecheck, /--noEmit/)
})

test('web and extension package typecheck scripts use isolated tsconfig files', () => {
  const webPackage = readJson(path.join('packages', 'web', 'package.json'))
  const extensionPackage = readJson(path.join('packages', 'extension', 'package.json'))
  const webTypecheckConfig = readJson(path.join('packages', 'web', 'tsconfig.typecheck.json'))
  const extensionTypecheckConfig = readJson(path.join('packages', 'extension', 'tsconfig.typecheck.json'))

  assert.equal(typeof webPackage.scripts?.typecheck, 'string')
  assert.match(webPackage.scripts.typecheck, /tsconfig\.typecheck\.json/)
  assert.equal(typeof extensionPackage.scripts?.typecheck, 'string')
  assert.match(extensionPackage.scripts.typecheck, /tsconfig\.typecheck\.json/)

  assert.equal(webTypecheckConfig.compilerOptions?.paths?.['@prompt-optimizer/ui'], undefined)
  assert.equal(webTypecheckConfig.compilerOptions?.paths?.['@prompt-optimizer/ui/*'], undefined)
  assert.equal(extensionTypecheckConfig.compilerOptions?.paths?.['@prompt-optimizer/ui'], undefined)
  assert.equal(extensionTypecheckConfig.compilerOptions?.paths?.['@prompt-optimizer/ui/*'], undefined)
  assert.match(extensionTypecheckConfig.include.join(' '), /\benv\.d\.ts\b/)
})

test('web dev loads root env while extension build stays isolated from root env', () => {
  const webViteConfig = fs.readFileSync(path.join(process.cwd(), 'packages', 'web', 'vite.config.ts'), 'utf8')
  const extensionViteConfig = fs.readFileSync(path.join(process.cwd(), 'packages', 'extension', 'vite.config.ts'), 'utf8')

  assert.match(webViteConfig, /loadEnv\(mode,\s*monorepoRoot\)/)
  assert.match(webViteConfig, /envDir:\s*monorepoRoot/)
  assert.match(webViteConfig, /DEFAULT_VITE_ENV/)
  assert.match(webViteConfig, /'process\.env'/)

  assert.doesNotMatch(extensionViteConfig, /loadEnv\(mode,\s*monorepoRoot\)/)
  assert.doesNotMatch(extensionViteConfig, /envDir:\s*monorepoRoot/)
  assert.doesNotMatch(extensionViteConfig, /DEFAULT_VITE_ENV/)
  assert.doesNotMatch(extensionViteConfig, /'process\.env'/)
})

test('mcp-server bin points to a file that exists before build output is generated', () => {
  const mcpPackagePath = path.join('packages', 'mcp-server', 'package.json')
  const mcpPackage = readJson(mcpPackagePath)
  const binEntry = mcpPackage.bin?.['prompt-optimizer-mcp']

  assert.equal(typeof binEntry, 'string')

  const binTargetPath = path.join(path.dirname(mcpPackagePath), binEntry)
  assert.equal(
    fs.existsSync(binTargetPath),
    true,
    `Expected ${binTargetPath} to exist so pnpm can create the workspace bin shim during install`,
  )
})

test('desktop package includes every runtime window icon', () => {
  const desktopPackage = readJson(path.join('packages', 'desktop', 'package.json'))
  const packagedFiles = desktopPackage.build?.files ?? []

  assert.ok(
    packagedFiles.includes('icons/**/*'),
    'Desktop build.files must include the icons directory used by main.js at runtime',
  )

  for (const iconName of ['app-icon.ico', 'app-icon.icns', 'app-icon.png']) {
    const iconPath = path.join(process.cwd(), 'packages', 'desktop', 'icons', iconName)
    assert.equal(fs.existsSync(iconPath), true, `Expected runtime icon ${iconPath} to exist`)
  }
})

test('desktop package defines a path-safe executable name', () => {
  const desktopPackage = readJson(path.join('packages', 'desktop', 'package.json'))
  const executableName = desktopPackage.build?.executableName

  assert.equal(executableName, 'PromptOptimizer')
  assert.match(
    executableName,
    /^[A-Za-z0-9._() -]+$/,
    'Desktop executableName must remain safe for Linux AppImage file paths',
  )
})
