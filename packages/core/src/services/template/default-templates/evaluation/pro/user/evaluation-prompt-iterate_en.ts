import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-pro-variable-prompt-iterate',
    name: 'Variable Prompt Iteration Evaluation',
    description: 'Evaluate a variable prompt against an iteration requirement',
    language: 'en',
    tags: ['evaluation', 'prompt-iterate', 'pro', 'user', 'variable'],
  },
  {
    subjectLabel: 'variable prompt',
    roleName: 'Variable Prompt Iteration Analysis Expert',
  },
  true
);
