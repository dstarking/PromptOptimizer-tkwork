import { createResultTemplate } from '../../builders';

export const template = createResultTemplate(
  {
    id: 'evaluation-pro-variable-result',
    name: '变量模式结果评估',
    description: '评估变量模式下单个结果的效果',
    language: 'zh',
    tags: ['evaluation', 'result', 'pro', 'user', 'variable'],
  },
  {
    subjectLabel: '变量提示词',
    roleName: '变量提示词结果评估专家',
  }
);
