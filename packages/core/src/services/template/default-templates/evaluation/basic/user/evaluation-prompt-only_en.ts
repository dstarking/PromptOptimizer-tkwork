import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-basic-user-prompt-only',
    name: 'User Prompt Direct Evaluation',
    description: 'Directly evaluate user prompt quality',
    language: 'en',
    tags: ['evaluation', 'prompt-only', 'basic', 'user'],
  },
  {
    subjectLabel: 'user prompt',
    roleName: 'User Prompt Analysis Expert',
  }
);
