import { createImageAnalysisTemplate } from '../builders';

export const template = createImageAnalysisTemplate(
  {
    id: 'evaluation-image-image2image-prompt-only',
    name: '图生图提示词直接评估',
    description: '直接评估图生图提示词质量（图生图模式）',
    language: 'zh',
    tags: ['evaluation', 'prompt-only', 'scoring', 'image', 'image2image'],
  },
  {
    subjectLabel: {
      zh: '图生图提示词',
      en: 'image-to-image prompt',
    },
    roleName: {
      zh: '图生图提示词分析专家',
      en: 'Image_To_Image_Prompt_Analysis_Expert',
    },
    dimensions: [
      {
        key: 'modificationClarity',
        label: {
          zh: '修改意图明确性',
          en: 'Modification Clarity',
        },
        description: {
          zh: '是否清晰描述对原图的修改方向和目标效果？',
          en: 'Does it clearly describe the modification direction and target effect for the source image?',
        },
      },
      {
        key: 'detailGuidance',
        label: {
          zh: '细节指导准确性',
          en: 'Detail Guidance',
        },
        description: {
          zh: '是否准确说明需要保留或修改的关键细节？',
          en: 'Does it accurately specify which important details should be preserved or changed?',
        },
      },
      {
        key: 'styleClarity',
        label: {
          zh: '风格和约束明确性',
          en: 'Style Clarity',
        },
        description: {
          zh: '艺术风格、修改强度、质量要求等约束是否明确定义？',
          en: 'Are artistic style, edit strength, and quality constraints clearly defined?',
        },
      },
      {
        key: 'improvementDegree',
        label: {
          zh: '改进程度',
          en: 'Improvement Degree',
        },
        description: {
          zh: '相比参考提示词或常见基线，当前工作区提示词的优化成熟度如何？',
          en: 'How mature is the optimization compared with the reference prompt or a common baseline?',
        },
      },
    ],
  },
);
