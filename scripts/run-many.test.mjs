import test from 'node:test';
import assert from 'node:assert/strict';

import { getRunnerSpec, parseArgs, runSequential, runParallel } from './run-many.js';

test('parseArgs supports sequential mode by default', () => {
  assert.deepEqual(parseArgs(['build:core', 'build:ui']), {
    parallel: false,
    scripts: ['build:core', 'build:ui'],
  });
});

test('parseArgs supports parallel aliases', () => {
  assert.deepEqual(parseArgs(['--parallel', 'build:web', 'build:ext']), {
    parallel: true,
    scripts: ['build:web', 'build:ext'],
  });
  assert.deepEqual(parseArgs(['-p', 'build:web', 'build:ext']), {
    parallel: true,
    scripts: ['build:web', 'build:ext'],
  });
});

test('getRunnerSpec avoids shell mode while preserving Windows pnpm compatibility', () => {
  assert.deepEqual(getRunnerSpec('win32', { ComSpec: 'C:\\Windows\\System32\\cmd.exe' }), {
    command: 'C:\\Windows\\System32\\cmd.exe',
    argsPrefix: ['/d', '/s', '/c', 'pnpm'],
    shell: false,
  });
  assert.deepEqual(getRunnerSpec('linux'), {
    command: 'pnpm',
    argsPrefix: [],
    shell: false,
  });
});

test('runSequential executes scripts in order and stops on failure', async () => {
  const executed = [];
  const runner = async (script) => {
    executed.push(script);
    if (script === 'build:ui') {
      throw new Error('boom');
    }
  };

  await assert.rejects(
    runSequential(['build:core', 'build:ui', 'build:web'], runner),
    /boom/
  );
  assert.deepEqual(executed, ['build:core', 'build:ui']);
});

test('runParallel waits for all scripts to finish when all succeed', async () => {
  const executed = [];
  const runner = async (script) => {
    await new Promise((resolve) => setTimeout(resolve, script === 'build:web' ? 10 : 1));
    executed.push(script);
  };

  await runParallel(['build:web', 'build:ext'], runner);
  assert.deepEqual(new Set(executed), new Set(['build:web', 'build:ext']));
});
