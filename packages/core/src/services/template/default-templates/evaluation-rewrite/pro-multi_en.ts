import { createEvaluationRewriteTemplate } from './builders';

export const template = createEvaluationRewriteTemplate(
  {
    id: 'evaluation-rewrite-pro-multi',
    name: 'Rewrite Multi-Message Prompt From Evaluation',
    description: 'Rewrite the current workspace multi-message system prompt from evaluation evidence',
    language: 'en',
    tags: ['evaluation', 'rewrite', 'pro', 'multi'],
  },
  {
    subjectLabel: 'multi-message system prompt',
  }
);
