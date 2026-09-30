import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-pro-variable-prompt-only',
    name: 'Variable Prompt Direct Evaluation',
    description: 'Directly evaluate variable prompt quality',
    language: 'en',
    tags: ['evaluation', 'prompt-only', 'pro', 'user', 'variable'],
  },
  {
    subjectLabel: 'variable prompt',
    roleName: 'Variable Prompt Analysis Expert',
  }
);
