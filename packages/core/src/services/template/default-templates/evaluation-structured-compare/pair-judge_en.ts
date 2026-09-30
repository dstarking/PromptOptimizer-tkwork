import { createStructuredCompareTemplate } from './builders';

export const template = createStructuredCompareTemplate(
  {
    id: 'evaluation-structured-compare-pair-judge-en',
    name: 'Structured Compare Pair Judge',
    description: 'Judge a single structured compare pair',
    language: 'en',
    tags: ['evaluation', 'structured-compare', 'pair-judge'],
  },
  'pair-judge'
);
