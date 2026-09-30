import { createCompareTemplate } from '../../builders';

export const template = createCompareTemplate(
  {
    id: 'evaluation-pro-variable-compare',
    name: 'Variable Prompt Compare Evaluation',
    description: 'Compare-evaluate the current workspace variable prompt from multiple test snapshots',
    language: 'en',
    tags: ['evaluation', 'compare', 'pro', 'user', 'variable'],
  },
  {
    subjectLabel: 'variable prompt',
    roleName: 'Variable Prompt Compare Evaluation Expert',
  }
);
