import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-basic-user',
    name: 'Rewrite User Prompt From Evaluation',
    description: 'Rewrite the current workspace user prompt from evaluation evidence',
    language: 'en',
    tags: ['evaluation', 'rewrite', 'basic', 'user'],
  },
  {
    subjectLabel: 'user prompt',
  }
);
