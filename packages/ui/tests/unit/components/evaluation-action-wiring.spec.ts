import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type ComponentRequirement = {
  component: string
  listeners: string[]
}

type FileComponentRequirement = ComponentRequirement & {
  file: string
  requirePresence?: boolean
}

const sourceRoot = join(process.cwd(), 'src')

const filesToCheck = [
  'components/PromptPanel.vue',
  'components/TestAreaPanel.vue',
  'components/TestResultSection.vue',
  'components/context-mode/ContextUserTestPanel.vue',
  'components/context-mode/ConversationTestPanel.vue',
  'components/basic-mode/BasicUserWorkspace.vue',
  'components/basic-mode/BasicSystemWorkspace.vue',
  'components/context-mode/ContextUserWorkspace.vue',
  'components/context-mode/ContextSystemWorkspace.vue',
  'components/image-mode/ImageText2ImageWorkspace.vue',
  'components/image-mode/ImageImage2ImageWorkspace.vue',
  'components/image-mode/ImageMultiImageWorkspace.vue',
]

const requirements: ComponentRequirement[] = [
  {
    component: 'EvaluationPanel',
    listeners: ['@apply-local-patch', '@apply-improvement'],
  },
  {
    component: 'EvaluationScoreBadge',
    listeners: ['@apply-improvement', '@apply-patch'],
  },
  {
    component: 'PromptPanelUI',
    listeners: ['@apply-improvement', '@apply-patch'],
  },
  {
    component: 'TestResultSection',
    listeners: [
      '@evaluate-with-feedback',
      '@show-primary-detail',
      '@show-secondary-detail',
      '@apply-improvement',
      '@apply-patch',
    ],
  },
]

const workspaceFiles = [
  'components/basic-mode/BasicUserWorkspace.vue',
  'components/basic-mode/BasicSystemWorkspace.vue',
  'components/context-mode/ContextUserWorkspace.vue',
  'components/context-mode/ContextSystemWorkspace.vue',
  'components/image-mode/ImageText2ImageWorkspace.vue',
  'components/image-mode/ImageImage2ImageWorkspace.vue',
  'components/image-mode/ImageMultiImageWorkspace.vue',
]

const promptPanelWorkspaceFiles = workspaceFiles

const textInputWorkspaceFiles = [
  'components/basic-mode/BasicUserWorkspace.vue',
  'components/basic-mode/BasicSystemWorkspace.vue',
  'components/context-mode/ContextUserWorkspace.vue',
]

const promptPanelPreviewWorkspaceFiles = [
  'components/context-mode/ContextUserWorkspace.vue',
  'components/context-mode/ContextSystemWorkspace.vue',
  'components/image-mode/ImageText2ImageWorkspace.vue',
  'components/image-mode/ImageImage2ImageWorkspace.vue',
  'components/image-mode/ImageMultiImageWorkspace.vue',
]

const promptPanelOriginalVersionWorkspaceFiles = [
  'components/basic-mode/BasicUserWorkspace.vue',
  'components/basic-mode/BasicSystemWorkspace.vue',
  'components/context-mode/ContextUserWorkspace.vue',
  'components/context-mode/ContextSystemWorkspace.vue',
]

const buildFileRequirements = (
  files: string[],
  component: string,
  listeners: string[],
): FileComponentRequirement[] =>
  files.map((file) => ({
    file,
    component,
    listeners,
    requirePresence: true,
  }))

const workspaceRequirements: FileComponentRequirement[] = [
  ...buildFileRequirements(workspaceFiles, 'WorkspaceUtilityMenu', ['@clear']),
  ...buildFileRequirements(textInputWorkspaceFiles, 'InputPanelUI', [
    '@submit',
    '@analyze',
  ]),
  ...buildFileRequirements(promptPanelWorkspaceFiles, 'PromptPanelUI', [
    '@iterate',
    '@openTemplateManager',
    '@switchVersion',
    '@save-favorite',
    '@apply-improvement',
    '@apply-patch',
    '@save-local-edit',
  ]),
  ...buildFileRequirements(promptPanelPreviewWorkspaceFiles, 'PromptPanelUI', [
    '@open-preview',
  ]),
  ...buildFileRequirements(promptPanelOriginalVersionWorkspaceFiles, 'PromptPanelUI', [
    '@switchToV0',
  ]),
  ...buildFileRequirements(workspaceFiles, 'TextModelQuickSwitch', [
    ':model-key',
    ':options',
    ':refresh-models',
  ]),
]

const extractComponentBlocks = (source: string, component: string) => {
  const lines = source.split(/\r?\n/)
  const blocks: Array<{ line: number; text: string }> = []

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index]?.includes(`<${component}`)) continue

    const start = index
    const collected: string[] = []
    for (let cursor = index; cursor < lines.length; cursor += 1) {
      const line = lines[cursor] || ''
      collected.push(line)
      if (line.includes('/>') || line.includes(`</${component}>`)) {
        index = cursor
        break
      }
    }

    blocks.push({
      line: start + 1,
      text: collected.join('\n'),
    })
  }

  return blocks
}

const collectMissingListeners = (requirementsToCheck: FileComponentRequirement[]) => {
  const missing: string[] = []

  for (const requirement of requirementsToCheck) {
    const source = readFileSync(join(sourceRoot, requirement.file), 'utf8')
    const blocks = extractComponentBlocks(source, requirement.component)

    if (blocks.length === 0) {
      if (requirement.requirePresence) {
        missing.push(`${requirement.file} missing <${requirement.component}>`)
      }
      continue
    }

    for (const block of blocks) {
      const missingListeners = requirement.listeners.filter(
        (listener) => !block.text.includes(listener),
      )

      if (missingListeners.length) {
        missing.push(
          `${requirement.file}:${block.line} <${requirement.component}> missing ${missingListeners.join(', ')}`,
        )
      }
    }
  }

  return missing
}

const countComponentOccurrences = (file: string, component: string) => {
  const source = readFileSync(join(sourceRoot, file), 'utf8')
  return extractComponentBlocks(source, component).length
}

describe('evaluation action wiring', () => {
  it('keeps apply action events connected at workspace boundaries', () => {
    const requirementsToCheck = filesToCheck.flatMap((file) =>
      requirements.map((requirement) => ({
        ...requirement,
        file,
      })),
    )

    const missing = collectMissingListeners(requirementsToCheck)

    expect(missing).toEqual([])
  })

  it('keeps shared workspace action controls wired consistently across modes', () => {
    const missing = collectMissingListeners(workspaceRequirements)

    expect(missing).toEqual([])
  })

  it('keeps text model quick switching available in primary and test model selectors', () => {
    const expectedMinimumOccurrences: Record<string, number> = {
      'components/basic-mode/BasicUserWorkspace.vue': 2,
      'components/basic-mode/BasicSystemWorkspace.vue': 2,
      'components/context-mode/ContextUserWorkspace.vue': 2,
      'components/context-mode/ContextSystemWorkspace.vue': 2,
      'components/image-mode/ImageText2ImageWorkspace.vue': 1,
      'components/image-mode/ImageImage2ImageWorkspace.vue': 1,
      'components/image-mode/ImageMultiImageWorkspace.vue': 1,
    }

    const missing = Object.entries(expectedMinimumOccurrences)
      .filter(([file, minimum]) => countComponentOccurrences(file, 'TextModelQuickSwitch') < minimum)
      .map(([file, minimum]) => `${file} needs at least ${minimum} <TextModelQuickSwitch> occurrences`)

    expect(missing).toEqual([])
  })

  it('keeps image model quick switching available in image test model selectors', () => {
    const expectedMinimumOccurrences: Record<string, number> = {
      'components/image-mode/ImageText2ImageWorkspace.vue': 1,
      'components/image-mode/ImageImage2ImageWorkspace.vue': 1,
      'components/image-mode/ImageMultiImageWorkspace.vue': 1,
    }

    const missing = Object.entries(expectedMinimumOccurrences)
      .filter(([file, minimum]) => countComponentOccurrences(file, 'ImageModelQuickSwitch') < minimum)
      .map(([file, minimum]) => `${file} needs at least ${minimum} <ImageModelQuickSwitch> occurrences`)

    expect(missing).toEqual([])
  })
})
