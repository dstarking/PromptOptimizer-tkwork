import { createResultTemplate } from '../../builders';

export const template = createResultTemplate(
  {
    id: 'evaluation-basic-user-result',
    name: 'User Prompt Result Evaluation',
    description: 'Evaluate the effectiveness of a single user prompt test result',
    language: 'en',
    tags: ['evaluation', 'result', 'basic', 'user'],
  },
  {
    subjectLabel: 'user prompt',
    roleName: 'User Prompt Execution Evaluation Expert',
  }
);
