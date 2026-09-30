import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateManager } from '../../../src/services/template/manager';
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider';
import { PreferenceService } from '../../../src/services/preference/service';
import {
  createTemplateLanguageService,
  type TemplateLanguageService,
} from '../../../src/services/template/languageService';

const BUILTIN_TEMPLATE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('builtin template id consistency', () => {
  let templateManager: TemplateManager;
  let languageService: TemplateLanguageService;

  beforeEach(() => {
    const storageProvider = new MemoryStorageProvider();
    const preferenceService = new PreferenceService(storageProvider);

    languageService = createTemplateLanguageService(preferenceService);
    vi.spyOn(languageService, 'initialize').mockResolvedValue(undefined);
    vi.spyOn(languageService, 'getCurrentLanguage').mockReturnValue('en-US');
    vi.spyOn(languageService, 'setLanguage').mockResolvedValue(undefined);
    vi.spyOn(languageService, 'getSupportedLanguages').mockReturnValue(['en-US', 'zh-CN']);

    templateManager = new TemplateManager(storageProvider, languageService);
  });

  it('should allow retrieving every builtin template returned by the English template list', async () => {
    const builtinTemplates = await templateManager.listTemplates();

    for (const template of builtinTemplates.filter(item => item.isBuiltin)) {
      await expect(templateManager.getTemplate(template.id)).resolves.toBeDefined();
    }
  });

  it('uses kebab-case ids for all builtin templates', async () => {
    const builtinTemplates = await templateManager.listTemplates();

    for (const template of builtinTemplates.filter(item => item.isBuiltin)) {
      expect(template.id).toMatch(BUILTIN_TEMPLATE_ID_PATTERN);
    }
  });
});
