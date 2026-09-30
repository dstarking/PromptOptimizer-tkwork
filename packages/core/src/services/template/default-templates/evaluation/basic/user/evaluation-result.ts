import { createResultTemplate } from '../../builders';

export const template = createResultTemplate(
  {
    id: 'evaluation-basic-user-result',
    name: '用户提示词结果评估',
    description: '评估单个用户提示词测试结果的效果',
    language: 'zh',
    tags: ['evaluation', 'result', 'basic', 'user'],
  },
  {
    subjectLabel: '用户提示词',
    roleName: '用户提示词结果评估专家',
  }
);
