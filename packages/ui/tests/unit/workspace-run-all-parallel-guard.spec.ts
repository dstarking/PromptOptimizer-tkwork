import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const workspaceFiles = [
  'src/components/basic-mode/BasicUserWorkspace.vue',
  'src/components/basic-mode/BasicSystemWorkspace.vue',
  'src/components/context-mode/ContextUserWorkspace.vue',
  'src/components/context-mode/ContextSystemWorkspace.vue',
] as const

const readWorkspaceSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8')

describe('multi-variant run-all parallel guards', () => {
  it.each(workspaceFiles)(
    'passes allowParallel through batch run dispatch in %s',
    (relativePath) => {
      const source = readWorkspaceSource(relativePath)

      expect(source).toMatch(/runTasksWithExecutionMode\([\s\S]*?runVariant\(id,\s*\{[\s\S]*?allowParallel:\s*true/)
    },
  )
})
