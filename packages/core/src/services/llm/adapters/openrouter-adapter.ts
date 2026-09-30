import type { TextModel, TextProvider } from '../types'
import { OpenAIAdapter } from './openai-adapter'

interface ModelOverride {
  id: string
  name: string
  description: string
  capabilities?: Partial<TextModel['capabilities']>
  defaultParameterValues?: Record<string, unknown>
}

const OPENROUTER_STATIC_MODELS: ModelOverride[] = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Models Router',
    description: 'OpenRouter router that selects a compatible free model for each request',
    capabilities: {
      supportsTools: true,
      supportsReasoning: false,
      maxContextLength: 200000
    }
  }
]

export class OpenRouterAdapter extends OpenAIAdapter {
  public getProvider(): TextProvider {
    return {
      id: 'openrouter',
      name: 'OpenRouter',
      description: 'OpenAI-compatible gateway for accessing models from many providers',
      requiresApiKey: true,
      defaultBaseURL: 'https://openrouter.ai/api/v1',
      supportsDynamicModels: true,
      apiKeyUrl: 'https://openrouter.ai/settings/keys',
      connectionSchema: {
        required: ['apiKey'],
        optional: ['baseURL'],
        fieldTypes: {
          apiKey: 'string',
          baseURL: 'string'
        }
      }
    }
  }

  public getModels(): TextModel[] {
    return OPENROUTER_STATIC_MODELS.map((definition) => {
      const baseModel = this.buildDefaultModel(definition.id)

      return {
        ...baseModel,
        name: definition.name,
        description: definition.description,
        capabilities: {
          ...baseModel.capabilities,
          ...(definition.capabilities ?? {})
        },
        defaultParameterValues: definition.defaultParameterValues
          ? {
              ...(baseModel.defaultParameterValues ?? {}),
              ...definition.defaultParameterValues
            }
          : baseModel.defaultParameterValues
      }
    })
  }
}
