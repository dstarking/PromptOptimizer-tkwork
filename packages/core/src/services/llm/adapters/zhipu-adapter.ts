import type { ParameterDefinition, TextModel, TextProvider } from '../types'
import { OpenAIAdapter } from './openai-adapter'

interface ModelOverride {
  id: string
  name: string
  description: string
  capabilities?: Partial<TextModel['capabilities']>
  defaultParameterValues?: Record<string, unknown>
}

const ZHIPU_STATIC_MODELS: ModelOverride[] = [
  {
    id: 'glm-5.3-flash',
    name: 'GLM-5.3-Flash',
    description: 'Latest efficient multimodal GLM model for reasoning, coding, and agentic tasks',
    capabilities: {
      supportsTools: true,
      supportsReasoning: true,
      maxContextLength: 1000000
    }
  },
  {
    id: 'glm-5.3',
    name: 'GLM-5.3',
    description: 'Latest GLM flagship model for complex reasoning, coding, and agentic tasks',
    capabilities: {
      supportsTools: true,
      supportsReasoning: true,
      maxContextLength: 1000000
    }
  },
  {
    id: 'glm-5.2',
    name: 'GLM-5.2',
    description: 'Previous GLM flagship model retained for compatibility',
    capabilities: {
      supportsTools: true,
      supportsReasoning: true,
      maxContextLength: 1000000
    }
  }
]

export class ZhipuAdapter extends OpenAIAdapter {
  public getProvider(): TextProvider {
    return {
      id: 'zhipu',
      name: 'Zhipu AI',
      description: 'Zhipu GLM OpenAI-compatible models',
      requiresApiKey: true,
      defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4',
      supportsDynamicModels: true,
      apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
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
    return ZHIPU_STATIC_MODELS.map((definition) => {
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

  protected getParameterDefinitions(modelId: string): readonly ParameterDefinition[] {
    return super.getParameterDefinitions(modelId).map((definition) => {
      if (definition.name !== 'reasoning_effort' || !/^glm-5\.(?:2|3)/.test(modelId)) {
        return definition
      }

      const allowedValues = modelId === 'glm-5.2' ? ['high', 'max'] : ['low', 'high', 'max']
      return {
        ...definition,
        description: 'Reasoning effort for current GLM models.',
        defaultValue: 'max',
        default: 'max',
        allowedValues
      }
    })
  }
}
