import { createResultTemplate } from '../../builders';

export const template = createResultTemplate(
  {
    id: 'evaluation-basic-system-result',
    name: 'System Prompt Result Evaluation',
    description: 'Evaluate the effectiveness of a single system prompt test result',
    language: 'en',
    tags: ['evaluation', 'result', 'basic', 'system'],
  },
  {
    subjectLabel: 'system prompt',
    roleName: 'System Prompt Execution Evaluation Expert',
  }
);
