import { createStructuredCompareTemplate } from './builders';

export const template = createStructuredCompareTemplate(
  {
    id: 'evaluation-structured-compare-synthesis-en',
    name: 'Structured Compare Synthesis',
    description: 'Synthesize structured compare pairwise results',
    language: 'en',
    tags: ['evaluation', 'structured-compare', 'synthesis'],
  },
  'synthesis'
);
