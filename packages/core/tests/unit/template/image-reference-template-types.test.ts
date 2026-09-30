import { describe, expect, it } from 'vitest'

import { ALL_TEMPLATES } from '../../../src/services/template/default-templates'
import { StaticLoader } from '../../../src/services/template/static-loader'
import { templateSchema } from '../../../src/services/template/types'

describe('image reference template types', () => {
  it('accepts the one-pass internal image reference template types', () => {
    const base = {
      id: 'test-template',
      name: 'test template',
      content: 'test content',
      metadata: {
        version: '1.0.0',
        lastModified: Date.now(),
      },
    }

    expect(
      templateSchema.safeParse({
        ...base,
        metadata: {
          ...base.metadata,
          templateType: 'image-prompt-composition',
        },
      }).success,
    ).toBe(true)

    expect(
      templateSchema.safeParse({
        ...base,
        metadata: {
          ...base.metadata,
          templateType: 'image-prompt-migration',
        },
      }).success,
    ).toBe(true)
  })

  it('rejects removed legacy and intermediate image template types', () => {
    const removedTypes = ['image-prompt-extraction', 'image-reference-prompt-seed-extraction']

    for (const templateType of removedTypes) {
      const result = templateSchema.safeParse({
        id: `${templateType}-template`,
        name: 'legacy template',
        content: 'legacy content',
        metadata: {
          version: '1.0.0',
          lastModified: Date.now(),
          templateType,
        },
      })

      expect(result.success).toBe(false)
    }
  })

  it('registers the one-pass internal template ids and removes intermediate extractor ids', () => {
    const loader = new StaticLoader()
    const templates = loader.loadTemplates()
    const templateIds = Object.values(ALL_TEMPLATES).map((template) => template.id)

    expect(templateIds).toContain('image-prompt-from-reference-image')
    expect(templateIds).toContain('image-prompt-migration')
    expect(templateIds).not.toContain('image-reference-prompt-seed-extraction')
    expect(templateIds).not.toContain('image-prompt-from-reference-seed')
    expect(templateIds).not.toContain('image-prompt-extraction')

    expect(templates.all['image-prompt-from-reference-image']).toBeDefined()
    expect(templates.all['image-prompt-migration']).toBeDefined()
    expect(templates.all['image-reference-prompt-seed-extraction']).toBeUndefined()
    expect(templates.all['image-prompt-from-reference-seed']).toBeUndefined()
    expect(
      templates.byType['image-prompt-composition'].zh['image-prompt-from-reference-image'],
    ).toBeDefined()
    expect(templates.byType['image-prompt-migration'].zh['image-prompt-migration']).toBeDefined()
  })
})
