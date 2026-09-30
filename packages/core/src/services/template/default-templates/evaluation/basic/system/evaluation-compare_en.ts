import { createCompareTemplate } from '../../builders';

export const template = createCompareTemplate(
  {
    id: 'evaluation-basic-system-compare',
    name: 'System Prompt Compare Evaluation',
    description: 'Compare-evaluate the current workspace system prompt from multiple test snapshots',
    language: 'en',
    tags: ['evaluation', 'compare', 'basic', 'system'],
  },
  {
    subjectLabel: 'system prompt',
    roleName: 'System Prompt Compare Evaluation Expert',
  }
);
