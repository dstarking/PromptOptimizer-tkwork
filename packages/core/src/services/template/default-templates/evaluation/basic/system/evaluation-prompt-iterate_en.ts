import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-basic-system-prompt-iterate',
    name: 'System Prompt Iteration Evaluation',
    description: 'Evaluate a system prompt against an iteration requirement',
    language: 'en',
    tags: ['evaluation', 'prompt-iterate', 'basic', 'system'],
  },
  {
    subjectLabel: 'system prompt',
    roleName: 'System Prompt Iteration Analysis Expert',
  },
  true
);
