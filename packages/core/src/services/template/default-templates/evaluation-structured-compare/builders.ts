import type { MessageTemplate, Template } from '../../types';
import {
  buildPairJudgeSystemPrompt,
  buildPairJudgeUserPrompt,
  buildSynthesisSystemPrompt,
  buildSynthesisUserPrompt,
} from './content';

type Language = 'zh' | 'en';
type TemplateKind = 'pair-judge' | 'synthesis';

interface TemplateIdentity {
  id: string;
  name: string;
  description: string;
  language: Language;
  tags: string[];
}

const buildMetadata = (identity: TemplateIdentity): Template['metadata'] => ({
  version: '1.0.0',
  lastModified: Date.now(),
  author: 'System',
  description: identity.description,
  templateType: 'evaluation',
  language: identity.language,
  tags: identity.tags,
});

export const createStructuredCompareTemplate = (
  identity: TemplateIdentity,
  kind: TemplateKind,
): Template => ({
  id: identity.id,
  name: identity.name,
  content: [
    {
      role: 'system',
      content:
        kind === 'pair-judge'
          ? buildPairJudgeSystemPrompt(identity.language)
          : buildSynthesisSystemPrompt(identity.language),
    },
    {
      role: 'user',
      content:
        kind === 'pair-judge'
          ? buildPairJudgeUserPrompt(identity.language)
          : buildSynthesisUserPrompt(identity.language),
    },
  ] as MessageTemplate[],
  metadata: buildMetadata(identity),
  isBuiltin: true,
});
