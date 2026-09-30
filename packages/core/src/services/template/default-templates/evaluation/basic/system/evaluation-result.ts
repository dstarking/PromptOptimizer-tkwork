import { createResultTemplate } from '../../builders';

export const template = createResultTemplate(
  {
    id: 'evaluation-basic-system-result',
    name: '系统提示词结果评估',
    description: '评估单个系统提示词测试结果的效果',
    language: 'zh',
    tags: ['evaluation', 'result', 'basic', 'system'],
  },
  {
    subjectLabel: '系统提示词',
    roleName: '系统提示词结果评估专家',
  }
);
