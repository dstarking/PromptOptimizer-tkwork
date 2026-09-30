import { createAnalysisTemplate } from '../../builders';

export const template = createAnalysisTemplate(
  {
    id: 'evaluation-pro-multi-prompt-iterate',
    name: 'Conversation Prompt Iteration Evaluation',
    description: 'Evaluate a conversation prompt against an iteration requirement',
    language: 'en',
    tags: ['evaluation', 'prompt-iterate', 'pro', 'system', 'multi'],
  },
  {
    subjectLabel: 'conversation prompt',
    roleName: 'Conversation Prompt Iteration Analysis Expert',
  },
  true
);
