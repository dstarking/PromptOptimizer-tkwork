import { createCompareTemplate } from '../../builders';

export const template = createCompareTemplate(
  {
    id: 'evaluation-pro-multi-compare',
    name: 'Conversation Prompt Compare Evaluation',
    description: 'Compare-evaluate the current workspace conversation prompt from multiple test snapshots',
    language: 'en',
    tags: ['evaluation', 'compare', 'pro', 'system', 'multi'],
  },
  {
    subjectLabel: 'conversation prompt',
    roleName: 'Conversation Prompt Compare Evaluation Expert',
  }
);
