import type {
  TextModel,
  TextProvider
} from '../types'
import { OpenAIAdapter } from './openai-adapter'

interface ModelOverride {
  id: string
  name: string
  description: string
  capabilities?: Partial<TextModel['capabilities']>
}

const XIAOMI_MIMO_STATIC_MODELS: ModelOverride[] = [
  {
    id: 'mimo-v2.5-pro',
    name: 'MiMo-V2.5-Pro',
    description: 'Xiaomi MiMo flagship reasoning model via OpenAI-compatible Chat Completions API',
    capabilities: {
      supportsTools: true,
      supportsReasoning: true,
      maxContextLength: 1000000
    }
  },
  {
    id: 'mimo-v2.5',
    name: 'MiMo-V2.5',
    description: 'Xiaomi MiMo multimodal-capable model via OpenAI-compatible Chat Completions API',
    capabilities: {
      supportsTools: true,
      supportsReasoning: true,
      maxContextLength: 1000000
    }
  }
]

export class XiaomiMimoTokenPlanAdapter extends OpenAIAdapter {
  public getProvider(): TextProvider {
    return {
      id: 'xiaomi-mimo-token-plan',
      name: 'Xiaomi MiMo Token Plan',
      description: 'Xiaomi MiMo Token Plan models via OpenAI-compatible API',
      requiresApiKey: true,
      defaultBaseURL: 'https://token-plan-cn.xiaomimimo.com/v1',
      supportsDynamicModels: true,
      apiKeyUrl: 'https://platform.xiaomimimo.com',
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
    return XIAOMI_MIMO_STATIC_MODELS.map((definition) => {
      const baseModel = this.buildDefaultModel(definition.id)

      return {
        ...baseModel,
        name: definition.name,
        description: definition.description,
        capabilities: {
          ...baseModel.capabilities,
          ...(definition.capabilities ?? {})
        }
      }
    })
  }

  protected getRequestStyle(): 'chat_completions' {
    return 'chat_completions'
  }
}
