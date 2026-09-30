import { createStructuredCompareTemplate } from './builders';

export const template = createStructuredCompareTemplate(
  {
    id: 'evaluation-structured-compare-synthesis',
    name: '结构化对比综合评估',
    description: '综合多条 structured compare pair 结果输出最终评估',
    language: 'zh',
    tags: ['evaluation', 'structured-compare', 'synthesis'],
  },
  'synthesis'
);
