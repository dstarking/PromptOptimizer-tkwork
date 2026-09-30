import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-basic-system',
    name: 'Rewrite System Prompt From Evaluation',
    description: 'Rewrite the current workspace system prompt from evaluation evidence',
    language: 'en',
    tags: ['evaluation', 'rewrite', 'basic', 'system'],
  },
  {
    subjectLabel: 'system prompt',
  }
);
