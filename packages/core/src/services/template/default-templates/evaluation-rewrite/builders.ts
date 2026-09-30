import type { MessageTemplate, Template } from '../../types';
import { buildRewriteUserPrompt } from './content';

type Language = 'zh' | 'en';

interface TemplateIdentity {
  id: string;
  name: string;
  description: string;
  language: Language;
  tags: string[];
}

interface SubjectConfig {
  subjectLabel: string;
}

const buildMetadata = (
  identity: TemplateIdentity,
): Template['metadata'] => ({
  version: '1.0.0',
  lastModified: Date.now(),
  author: 'System',
  description: identity.description,
  templateType: 'evaluation',
  language: identity.language,
  tags: identity.tags,
});

export const createEvaluationRewriteTemplate = (
  identity: TemplateIdentity,
  subject: SubjectConfig,
): Template => ({
  id: identity.id,
  name: identity.name,
  content: [
    {
      role: 'user',
      content: buildRewriteUserPrompt(identity.language, subject),
    },
  ] as MessageTemplate[],
  metadata: buildMetadata(identity),
  isBuiltin: true,
});
