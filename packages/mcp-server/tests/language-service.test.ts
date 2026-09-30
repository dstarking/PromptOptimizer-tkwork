import { describe, expect, it } from 'vitest';
import { SimpleLanguageService, createSimpleLanguageService } from '../src/adapters/language-service.js';

describe('SimpleLanguageService', () => {
  it('defaults to en-US when no explicit language is provided', async () => {
    const service = createSimpleLanguageService();

    await service.initialize();

    expect(await service.getCurrentLanguage()).toBe('en-US');
    expect(await service.getSupportedLanguages()).toEqual(['en-US', 'zh-CN']);
  });

  it('falls back to en-US for unsupported language values', async () => {
    const service = new SimpleLanguageService('fr-FR');

    await service.initialize();

    expect(await service.getCurrentLanguage()).toBe('en-US');
  });

  it('keeps localized language display names', () => {
    const service = new SimpleLanguageService();

    expect(service.getLanguageDisplayName('zh-CN')).toBe('中文');
    expect(service.getLanguageDisplayName('en-US')).toBe('English');
  });
});
