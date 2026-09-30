import { createImageAnalysisTemplate } from '../builders';

export const template = createImageAnalysisTemplate(
  {
    id: 'evaluation-image-text2image-prompt-only',
    name: 'Image Generation Prompt Direct Evaluation',
    description: 'Direct evaluation of image generation prompt quality (text-to-image mode)',
    language: 'en',
    tags: ['evaluation', 'prompt-only', 'scoring', 'image', 'text2image'],
  },
  {
    subjectLabel: {
      zh: '图像生成提示词',
      en: 'image-generation prompt',
    },
    roleName: {
      zh: '图像生成提示词分析专家',
      en: 'Image_Generation_Prompt_Analysis_Expert',
    },
    dimensions: [
      {
        key: 'visualCompleteness',
        label: {
          zh: '视觉描述完整性',
          en: 'Visual Completeness',
        },
        description: {
          zh: '是否清晰描述主体、场景、构图等核心视觉元素？',
          en: 'Does it clearly describe core visual elements such as subject, scene, and composition?',
        },
      },
      {
        key: 'detailAccuracy',
        label: {
          zh: '细节表达准确性',
          en: 'Detail Accuracy',
        },
        description: {
          zh: '是否准确描述光影、色彩、质感、氛围等关键细节？',
          en: 'Does it accurately specify important details such as lighting, color, texture, and atmosphere?',
        },
      },
      {
        key: 'styleClarity',
        label: {
          zh: '风格和约束明确性',
          en: 'Style Clarity',
        },
        description: {
          zh: '艺术风格、画面比例、质量要求等约束是否明确定义？',
          en: 'Are artistic style, aspect ratio, and quality constraints clearly defined?',
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
