import { describe, expect, it } from 'vitest'
import { TextAdapterRegistry } from '../../../src/services/llm/adapters/registry'
import { resolveTextModelMetadata } from '../../../src/services/model/metadata-resolver'

describe('resolveTextModelMetadata', () => {
  it('reuses matching existing metadata', () => {
    const registry = new TextAdapterRegistry()
    const adapter = registry.getAdapter('openai')
    const providerMeta = {
      ...adapter.getProvider(),
      name: 'Custom OpenAI Label',
    }
    const modelMeta = {
      ...adapter.buildDefaultModel('custom-openai-model'),
      name: 'Custom OpenAI Model Label',
    }

    const resolved = resolveTextModelMetadata({
      providerId: 'openai',
      modelId: 'custom-openai-model',
      registry,
      existingProviderMeta: providerMeta,
      existingModelMeta: modelMeta,
    })

    expect(resolved.providerMeta).toBe(providerMeta)
    expect(resolved.modelMeta).toBe(modelMeta)
  })

  it('rebuilds provider and model metadata when the selected provider changes', () => {
    const registry = new TextAdapterRegistry()
    const openaiAdapter = registry.getAdapter('openai')

    const resolved = resolveTextModelMetadata({
      providerId: 'openai-compatible',
      modelId: 'custom-model',
      registry,
      existingProviderMeta: openaiAdapter.getProvider(),
      existingModelMeta: openaiAdapter.buildDefaultModel('gpt-5-mini'),
    })

    expect(resolved.providerMeta.id).toBe('openai-compatible')
    expect(resolved.modelMeta.id).toBe('custom-model')
    expect(resolved.modelMeta.providerId).toBe('openai-compatible')
  })

  it('builds default model metadata for unknown model ids under the selected provider', () => {
    const registry = new TextAdapterRegistry()

    const resolved = resolveTextModelMetadata({
      providerId: 'openai-compatible',
      modelId: 'vendor-special-model',
      registry,
    })

    expect(resolved.providerMeta.id).toBe('openai-compatible')
    expect(resolved.modelMeta.id).toBe('vendor-special-model')
    expect(resolved.modelMeta.providerId).toBe('openai-compatible')
  })
})
