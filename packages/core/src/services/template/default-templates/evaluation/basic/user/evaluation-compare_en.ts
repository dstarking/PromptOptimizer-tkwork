import { createCompareTemplate } from '../../builders';

export const template = createCompareTemplate(
  {
    id: 'evaluation-basic-user-compare',
    name: 'User Prompt Compare Evaluation',
    description: 'Compare-evaluate the current workspace user prompt from multiple test snapshots',
    language: 'en',
    tags: ['evaluation', 'compare', 'basic', 'user'],
  },
  {
    subjectLabel: 'user prompt',
    roleName: 'User Prompt Compare Evaluation Expert',
  }
);
