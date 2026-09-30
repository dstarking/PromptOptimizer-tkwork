import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');

const fromWorkspaceRoot = (...segments: string[]): string =>
  join(workspaceRoot, ...segments);

const templateRoots = [
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'template', 'default-templates', 'evaluation'),
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'template', 'default-templates', 'evaluation-rewrite'),
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'template', 'default-templates', 'evaluation-structured-compare'),
] as const;

const runtimeGuardTargets = [
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'evaluation', 'rewrite-from-evaluation.ts'),
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'evaluation', 'service.ts'),
] as const;

const builderGuardTargets = [
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'template', 'default-templates', 'evaluation', 'builders.ts'),
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'template', 'default-templates', 'evaluation', 'image', 'builders.ts'),
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'template', 'default-templates', 'evaluation-rewrite', 'builders.ts'),
  fromWorkspaceRoot('packages', 'core', 'src', 'services', 'template', 'default-templates', 'evaluation-structured-compare', 'builders.ts'),
] as const;

const collectTemplateFiles = (root: string): string[] => {
  const visit = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const fullPath = join(dir, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        return visit(fullPath);
      }

      if (
        !entry.endsWith('.ts') ||
        entry === 'index.ts' ||
        entry === 'builders.ts' ||
        entry === 'content.ts' ||
        entry === 'runtime-copy.ts' ||
        entry.endsWith('.test.ts')
      ) {
        return [];
      }

      return [fullPath];
    });

  return visit(root);
};

const extractTemplateTokens = (content: string): string[] => {
  const tokens = new Set<string>();
  const matches = content.matchAll(/{{{?\s*([#/^>]?\s*[a-zA-Z0-9_.-]+)\s*}?}}/g);

  for (const match of matches) {
    const rawToken = match[1].replace(/\s+/g, '');
    if (rawToken.startsWith('/')) {
      continue;
    }
    tokens.add(rawToken);
  }

  return Array.from(tokens).sort();
};

describe('evaluation template guardrails', () => {
  it('keeps zh/en template assets paired across evaluation domains', () => {
    for (const root of templateRoots) {
      const files = collectTemplateFiles(root);
      const zhFiles = files
        .filter((file) => !file.endsWith('_en.ts'))
        .map((file) => relative(root, file).replace(/\\/g, '/'))
        .sort();
      const enFiles = files
        .filter((file) => file.endsWith('_en.ts'))
        .map((file) => relative(root, file).replace(/_en\.ts$/, '.ts').replace(/\\/g, '/'))
        .sort();

      expect(enFiles, `${root} English templates should match zh templates`).toEqual(zhFiles);
    }
  });

  it('keeps zh/en template placeholder sets aligned', () => {
    for (const root of templateRoots) {
      const files = collectTemplateFiles(root).filter((file) => file.endsWith('_en.ts'));

      for (const enFile of files) {
        const zhFile = enFile.replace(/_en\.ts$/, '.ts');
        const zhContent = readFileSync(zhFile, 'utf8');
        const enContent = readFileSync(enFile, 'utf8');

        expect(
          extractTemplateTokens(enContent),
          `${relative(root, enFile)} placeholders should match ${relative(root, zhFile)}`
        ).toEqual(extractTemplateTokens(zhContent));
      }
    }
  });

  it('keeps evaluation runtime code free of embedded prompt body copy', () => {
    const forbiddenMarkers = [
      '#### Executed Prompt',
      '#### 执行提示词',
      'Progress/进步判断',
      'Reference Gap',
      '改动有效性',
      'Priority: ',
      '优先项',
    ];

    for (const target of runtimeGuardTargets) {
      const content = readFileSync(target, 'utf8');

      for (const marker of forbiddenMarkers) {
        expect(content).not.toContain(marker);
      }
    }
  });

  it('keeps template builders focused on structure rather than full prompt prose', () => {
    const forbiddenMarkers = [
      '# Role:',
      '## Goal',
      '## Rules',
      'Requirements:',
      'Rewrite the current workspace',
      '请只根据下面这份 JSON payload',
      'Pair Judge Evidence Payload (JSON):',
      '请只使用下面的 JSON payload 作为证据来源。',
    ];

    for (const target of builderGuardTargets) {
      const content = readFileSync(target, 'utf8');

      for (const marker of forbiddenMarkers) {
        expect(content).not.toContain(marker);
      }
    }
  });
});
