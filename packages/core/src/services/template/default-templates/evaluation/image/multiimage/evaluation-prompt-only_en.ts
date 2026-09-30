import { createImageAnalysisTemplate } from '../builders';

export const template = createImageAnalysisTemplate(
  {
    id: 'evaluation-image-multiimage-prompt-only',
    name: 'Multi-Image Prompt Direct Evaluation',
    description: 'Direct evaluation of multi-image generation prompt quality',
    language: 'en',
    tags: ['evaluation', 'prompt-only', 'scoring', 'image', 'multiimage'],
  },
  {
    subjectLabel: {
      zh: '多图生图提示词',
      en: 'multi-image generation prompt',
    },
    roleName: {
      zh: '多图生图提示词分析专家',
      en: 'Multi_Image_Prompt_Analysis_Expert',
    },
    dimensions: [
      {
        key: 'referenceIntegration',
        label: {
          zh: '参考图融合明确性',
          en: 'Reference Integration',
        },
        description: {
          zh: '是否清晰说明多张参考图各自的作用、取舍和融合关系？',
          en: 'Does it clearly state each reference image role, priority, and integration relationship?',
        },
      },
      {
        key: 'generationIntent',
        label: {
          zh: '生成目标清晰度',
          en: 'Generation Intent',
        },
        description: {
          zh: '是否明确描述最终画面的主体、场景、构图和目标效果？',
          en: 'Does it clearly describe the final subject, scene, composition, and target effect?',
        },
      },
      {
        key: 'constraintClarity',
        label: {
          zh: '保留与修改约束',
          en: 'Preservation and Edit Constraints',
        },
        description: {
          zh: '是否准确说明哪些元素应保留、替换、强化或弱化？',
          en: 'Does it accurately specify which elements should be preserved, replaced, emphasized, or reduced?',
        },
      },
      {
        key: 'styleConsistency',
        label: {
          zh: '风格一致性',
          en: 'Style Consistency',
        },
        description: {
          zh: '是否给出足够的风格、光影、色彩和质量约束来统一多图来源？',
          en: 'Does it provide enough style, lighting, color, and quality constraints to unify multiple image sources?',
        },
      },
    ],
  },
);
