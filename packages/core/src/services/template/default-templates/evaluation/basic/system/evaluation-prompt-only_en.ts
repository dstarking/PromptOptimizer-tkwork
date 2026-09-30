import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-basic-system-prompt-only',
    name: 'System Prompt Direct Evaluation',
    description: 'Directly evaluate system prompt quality',
    language: 'en',
    tags: ['evaluation', 'prompt-only', 'basic', 'system'],
  },
  {
    subjectLabel: 'system prompt',
    roleName: 'System Prompt Analysis Expert',
  }
);
