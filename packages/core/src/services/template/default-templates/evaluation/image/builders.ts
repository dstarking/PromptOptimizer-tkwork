import type { MessageTemplate, Template, TemplateMetadata } from '../../../types';
import {
  buildImageAnalysisSystemPrompt,
  buildImageAnalysisUserPrompt,
} from './content';

type Language = 'zh' | 'en';

interface LocalizedText {
  zh: string;
  en: string;
}

interface TemplateIdentity {
  id: string;
  name: string;
  description: string;
  language: Language;
  tags: string[];
}

interface DimensionDefinition {
  key: string;
  label: LocalizedText;
  description: LocalizedText;
}

interface ImageAnalysisConfig {
  subjectLabel: LocalizedText;
  roleName: LocalizedText;
  dimensions: DimensionDefinition[];
}

const buildMetadata = (identity: TemplateIdentity): TemplateMetadata => ({
  version: '5.0.0',
  lastModified: Date.now(),
  author: 'System',
  description: identity.description,
  templateType: 'evaluation',
  language: identity.language,
  tags: identity.tags,
});

export const createImageAnalysisTemplate = (
  identity: TemplateIdentity,
  config: ImageAnalysisConfig,
  iterate = false,
): Template => ({
  id: identity.id,
  name: identity.name,
  content: [
    {
      role: 'system',
      content: buildImageAnalysisSystemPrompt(identity.language, config, iterate),
    },
    {
      role: 'user',
      content: buildImageAnalysisUserPrompt(identity.language, config, iterate),
    },
  ] as MessageTemplate[],
  metadata: buildMetadata(identity),
  isBuiltin: true,
});
