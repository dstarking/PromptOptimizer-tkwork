import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-basic-user-prompt-iterate',
    name: 'User Prompt Iteration Evaluation',
    description: 'Evaluate a user prompt against an iteration requirement',
    language: 'en',
    tags: ['evaluation', 'prompt-iterate', 'basic', 'user'],
  },
  {
    subjectLabel: 'user prompt',
    roleName: 'User Prompt Iteration Analysis Expert',
  },
  true
);
