import type { MessageTemplate, Template } from '../../types';
import {
  analysisJsonContractEn,
  analysisJsonContractZh,
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  buildCompareSystemPrompt,
  buildCompareUserPrompt,
  buildResultSystemPrompt,
  buildResultUserPrompt,
  compareJsonContractEn,
  compareJsonContractZh,
  resultJsonContractEn,
  resultJsonContractZh,
} from './content';

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
  roleName: string;
}

const buildMetadata = (
  identity: TemplateIdentity,
  templateType: 'evaluation',
) => ({
  version: '5.0.0',
  lastModified: Date.now(),
  author: 'System',
  description: identity.description,
  templateType,
  language: identity.language,
  tags: identity.tags,
});

export const createAnalysisTemplate = (
  identity: TemplateIdentity,
  subject: SubjectConfig,
  iterate = false,
): Template => ({
  id: identity.id,
  name: identity.name,
  content: [
    {
      role: 'system',
      content: buildAnalysisSystemPrompt(identity.language, subject, iterate),
    },
    {
      role: 'user',
      content: buildAnalysisUserPrompt(identity.language, subject, iterate),
    },
  ] as MessageTemplate[],
  metadata: buildMetadata(identity, 'evaluation'),
  isBuiltin: true,
});

export const createResultTemplate = (
  identity: TemplateIdentity,
  subject: SubjectConfig,
): Template => ({
  id: identity.id,
  name: identity.name,
  content: [
    {
      role: 'system',
      content: buildResultSystemPrompt(identity.language, subject),
    },
    {
      role: 'user',
      content: buildResultUserPrompt(identity.language, subject),
    },
  ] as MessageTemplate[],
  metadata: buildMetadata(identity, 'evaluation'),
  isBuiltin: true,
});

export const createCompareTemplate = (
  identity: TemplateIdentity,
  subject: SubjectConfig,
): Template => ({
  id: identity.id,
  name: identity.name,
  content: [
    {
      role: 'system',
      content: buildCompareSystemPrompt(identity.language, subject),
    },
    {
      role: 'user',
      content: buildCompareUserPrompt(identity.language, subject),
    },
  ] as MessageTemplate[],
  metadata: buildMetadata(identity, 'evaluation'),
  isBuiltin: true,
});

export {
  analysisJsonContractEn,
  analysisJsonContractZh,
  compareJsonContractEn,
  compareJsonContractZh,
  resultJsonContractEn,
  resultJsonContractZh,
};
