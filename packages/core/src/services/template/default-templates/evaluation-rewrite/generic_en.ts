import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-generic',
    name: 'Rewrite Prompt From Evaluation',
    description: 'Rewrite the current workspace prompt from evaluation evidence',
    language: 'en',
    tags: ['evaluation', 'rewrite', 'generic'],
  },
  {
    subjectLabel: 'workspace prompt',
  }
);
