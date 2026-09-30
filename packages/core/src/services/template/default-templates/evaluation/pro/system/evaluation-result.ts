import { createResultTemplate } from '../../builders';

export const template = createResultTemplate(
  {
    id: 'evaluation-pro-multi-result',
    name: '上下文消息结果评估',
    description: '评估多消息模式下单个结果的效果',
    language: 'zh',
    tags: ['evaluation', 'result', 'pro', 'system', 'multi'],
  },
  {
    subjectLabel: '上下文消息提示词',
    roleName: '上下文消息结果评估专家',
  }
);
