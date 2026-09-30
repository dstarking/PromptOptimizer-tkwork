import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-pro-multi-prompt-only',
    name: 'Conversation Prompt Direct Evaluation',
    description: 'Directly evaluate conversation prompt quality',
    language: 'en',
    tags: ['evaluation', 'prompt-only', 'pro', 'system', 'multi'],
  },
  {
    subjectLabel: 'conversation prompt',
    roleName: 'Conversation Prompt Analysis Expert',
  }
);
