import { createStructuredCompareTemplate } from './builders';

export const template = createStructuredCompareTemplate(
  {
    id: 'evaluation-structured-compare-pair-judge',
    name: '结构化对比成对判断',
    description: '对单个 structured compare pair 做中间判断',
    language: 'zh',
    tags: ['evaluation', 'structured-compare', 'pair-judge'],
  },
  'pair-judge'
);
