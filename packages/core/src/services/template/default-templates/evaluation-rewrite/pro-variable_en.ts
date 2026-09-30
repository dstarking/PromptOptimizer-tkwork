import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-pro-variable',
    name: 'Rewrite Variable Prompt From Evaluation',
    description: 'Rewrite the current workspace variable user prompt from evaluation evidence',
    language: 'en',
    tags: ['evaluation', 'rewrite', 'pro', 'variable'],
  },
  {
    subjectLabel: 'variable user prompt',
  }
);
