import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadConfig } from '../src/config/environment.js';
import { resolveDefaultLanguage } from '../src/adapters/core-services.js';

describe('MCP environment defaults', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.MCP_DEFAULT_LANGUAGE;
  });

  it('defaults loadConfig to en-US when MCP_DEFAULT_LANGUAGE is unset', () => {
    delete process.env.MCP_DEFAULT_LANGUAGE;

    expect(loadConfig().defaultLanguage).toBe('en-US');
  });

  it('resolves the core services language fallback to en-US', () => {
    delete process.env.MCP_DEFAULT_LANGUAGE;

    expect(resolveDefaultLanguage({ defaultLanguage: '' })).toBe('en-US');
  });

  it('honors MCP_DEFAULT_LANGUAGE when config.defaultLanguage is missing', () => {
    vi.stubEnv('MCP_DEFAULT_LANGUAGE', 'zh-CN');

    expect(resolveDefaultLanguage({ defaultLanguage: '' })).toBe('zh-CN');
  });
});
