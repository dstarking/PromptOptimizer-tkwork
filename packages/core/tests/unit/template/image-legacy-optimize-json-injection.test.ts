import { describe, expect, it } from 'vitest';
import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor';
import { template as imageGeneralOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/text2image/general-image-optimize';
import { template as imageGeneralOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/text2image/general-image-optimize_en';
import { template as imagePhotographyOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/text2image/photography-optimize';
import { template as imagePhotographyOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/text2image/photography-optimize_en';
import { template as imageCreativeText2imageZh } from '../../../src/services/template/default-templates/image-optimize/text2image/creative-text2image';
import { template as imageCreativeText2imageEn } from '../../../src/services/template/default-templates/image-optimize/text2image/creative-text2image_en';
import { template as imageChineseModelOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/text2image/chinese-model-optimize';
import { template as imageChineseModelOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/text2image/chinese-model-optimize_en';
import { template as image2imageOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/image2image/image2image-optimize';
import { template as image2imageOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/image2image/image2image-optimize_en';
import { template as designTextEditOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/image2image/design-text-edit-optimize';
import { template as designTextEditOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/image2image/design-text-edit-optimize_en';

describe('legacy image optimize templates JSON evidence injection', () => {
  const baseContext: TemplateContext = {
    originalPrompt:
      '保留 {{subject_name}} 和 {{style_hint}}。\n```json\n{"negative_prompt":["blurry","crowded"]}\n```',
  };

  it.each([
    ['zh general', imageGeneralOptimizeZh],
    ['en general', imageGeneralOptimizeEn],
    ['zh photography', imagePhotographyOptimizeZh],
    ['en photography', imagePhotographyOptimizeEn],
    ['zh creative', imageCreativeText2imageZh],
    ['en creative', imageCreativeText2imageEn],
    ['zh chinese-model', imageChineseModelOptimizeZh],
    ['en chinese-model', imageChineseModelOptimizeEn],
    ['zh image2image', image2imageOptimizeZh],
    ['en image2image', image2imageOptimizeEn],
    ['zh design-text-edit', designTextEditOptimizeZh],
    ['en design-text-edit', designTextEditOptimizeEn],
  ])('should render %s template with JSON-wrapped original prompt evidence', (_label, template) => {
    const messages = TemplateProcessor.processTemplate(template, baseContext);

    expect(messages[1].content).toContain('"originalPrompt": ');
    expect(messages[1].content).toContain('{{subject_name}}');
    expect(messages[1].content).toContain('{{style_hint}}');
    expect(messages[1].content).toContain('\\"negative_prompt\\"');
  });
});
