import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import {
  setupVCRForTest,
  throwIfCurrentTestHasVCRFailure,
  waitForConditionOrVCRFailure,
} from '../../../../../tests/e2e/helpers/vcr'

const sanitizeFixtureSegment = (name: string) =>
  name
    .replace(/\\/g, '-')
    .replace(/[^\u4e00-\u9fa5a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

const createFakeRoute = (
  body: Record<string, unknown>,
  url = 'https://api.deepseek.com/v1/chat/completions',
) => {
  const abort = vi.fn(async () => {})
  const continueFn = vi.fn(async () => {})
  const fulfill = vi.fn(async () => {})

  return {
    abort,
    continue: continueFn,
    fulfill,
    request: () => ({
      url: () => url,
      method: () => 'POST',
      postData: async () => JSON.stringify(body),
      headers: () => ({}),
    }),
  }
}

describe('E2E VCR auto replay behavior', () => {
  let fixtureDir = ''

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()

    if (fixtureDir) {
      await fs.rm(fixtureDir, { recursive: true, force: true })
      fixtureDir = ''
    }
  })

  it('fails fast with a deterministic mock API error when a fixture file exists but the current interaction hash is missing', async () => {
    fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-optimizer-vcr-'))

    vi.stubEnv('E2E_VCR_MODE', 'auto')
    vi.stubEnv('E2E_VCR_FIXTURE_DIR', fixtureDir)

    const testName = 'test\\image-text2image-generate.spec.ts'
    const testCase = '切换到 SiliconFlow 图像模型并生成图片（对比模式）'

    const fixturePath = path.join(
      fixtureDir,
      sanitizeFixtureSegment(testName),
      `${sanitizeFixtureSegment(testCase)}.json`
    )

    await fs.mkdir(path.dirname(fixturePath), { recursive: true })
    await fs.writeFile(
      fixturePath,
      JSON.stringify(
        {
          testName,
          testCase,
          interactions: [
            {
              provider: 'deepseek',
              url: 'https://api.deepseek.com/v1/chat/completions',
              method: 'POST',
              requestBody: { model: 'deepseek-chat', messages: [{ role: 'user', content: 'old body' }] },
              requestHash: 'fixture-only-hash',
              rawBody: 'data: [DONE]\n\n',
              responseHeaders: { 'content-type': 'text/event-stream' },
              responseBody: null,
              duration: 10,
              status: 200,
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    )

    const handlers: Array<(route: any) => Promise<void>> = []
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const page = {
      route: vi.fn(async (_pattern: unknown, handler: (route: any) => Promise<void>) => {
        handlers.push(handler)
      }),
    }

    await setupVCRForTest(page as any, testName, testCase)

    const deepseekHandler = handlers[0]
    expect(deepseekHandler).toBeTypeOf('function')

    const route = createFakeRoute({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'new body' }],
      stream: true,
    })

    await deepseekHandler(route as any)

    expect(() => throwIfCurrentTestHasVCRFailure()).toThrowError(
      /Fixture interaction not found for test:/
    )
    await expect(
      waitForConditionOrVCRFailure(async () => false, {
        timeoutMs: 5000,
        intervalMs: 10,
        description: 'should stop immediately on VCR failure',
      }),
    ).rejects.toThrow(/Fixture interaction not found for test:/)

    expect(route.abort).not.toHaveBeenCalled()
    expect(route.continue).not.toHaveBeenCalled()
    expect(route.fulfill).toHaveBeenCalledOnce()
    expect(route.fulfill).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
        }),
      }),
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[VCR] ❌ Fixture interaction not found for test:')
    )
  })

  it('replays image-generation fixtures even when legacy request hashes and image payload bytes no longer match exactly', async () => {
    fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-optimizer-vcr-'))

    vi.stubEnv('E2E_VCR_MODE', 'replay')
    vi.stubEnv('E2E_VCR_FIXTURE_DIR', fixtureDir)

    const testName = 'test\\image-image2image-generate.spec.ts'
    const testCase = '上传输入图并在对比模式下生成 original+optimized 两张图'

    const fixturePath = path.join(
      fixtureDir,
      sanitizeFixtureSegment(testName),
      `${sanitizeFixtureSegment(testCase)}.json`
    )

    await fs.mkdir(path.dirname(fixturePath), { recursive: true })
    await fs.writeFile(
      fixturePath,
      JSON.stringify(
        {
          testName,
          testCase,
          interactions: [
            {
              provider: 'siliconflow',
              url: 'https://api.siliconflow.cn/v1/images/generations',
              method: 'POST',
              requestBody: {
                model: 'Kwai-Kolors/Kolors',
                prompt: 'make it watercolor style',
                image: 'data:image/png;base64,fixture-seed-image',
              },
              requestHash: 'legacy-raw-image-hash',
              rawBody: JSON.stringify({
                images: [{ url: 'https://example.com/generated.png' }],
                data: [{ url: 'https://example.com/generated.png' }],
              }),
              responseHeaders: { 'content-type': 'application/json' },
              responseBody: {
                images: [{ url: 'https://example.com/generated.png' }],
                data: [{ url: 'https://example.com/generated.png' }],
              },
              duration: 10,
              status: 200,
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    )

    const handlers: Array<(route: any) => Promise<void>> = []
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const page = {
      route: vi.fn(async (_pattern: unknown, handler: (route: any) => Promise<void>) => {
        handlers.push(handler)
      }),
    }

    await setupVCRForTest(page as any, testName, testCase)

    const siliconflowHandler = handlers.find((handler, index) => {
      if (index < 6) return false
      return typeof handler === 'function'
    })
    expect(siliconflowHandler).toBeTypeOf('function')

    const route = createFakeRoute(
      {
        model: 'Kwai-Kolors/Kolors',
        prompt: 'make it watercolor style',
        image: 'data:image/png;base64,current-runtime-image-that-differs-from-fixture',
      },
      'https://api.siliconflow.cn/v1/images/generations'
    )

    await siliconflowHandler!(route as any)

    expect(() => throwIfCurrentTestHasVCRFailure()).not.toThrow()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(route.abort).not.toHaveBeenCalled()
    expect(route.continue).not.toHaveBeenCalled()
    expect(route.fulfill).toHaveBeenCalledOnce()
    expect(route.fulfill).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
        }),
      }),
    )

    const fulfillPayload = route.fulfill.mock.calls[0]?.[0]
    const replayBody = JSON.parse(String(fulfillPayload?.body || '{}'))

    expect(replayBody.images).toHaveLength(1)
    expect(replayBody.data).toHaveLength(1)
    expect(replayBody.images[0]?.url).toMatch(/^data:image\/svg\+xml;base64,/)
    expect(replayBody.data[0]?.url).toMatch(/^data:image\/svg\+xml;base64,/)
    expect(replayBody.images[0]?.url).not.toMatch(/^https?:\/\//)
    expect(replayBody.data[0]?.url).not.toMatch(/^https?:\/\//)
  })

  it('registers DashScope compatible-mode routes so replay mode never leaks multimodal optimize requests', async () => {
    fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-optimizer-vcr-'))

    vi.stubEnv('E2E_VCR_MODE', 'replay')
    vi.stubEnv('E2E_VCR_FIXTURE_DIR', fixtureDir)

    const patterns: unknown[] = []
    const page = {
      route: vi.fn(async (pattern: unknown, _handler: (route: any) => Promise<void>) => {
        patterns.push(pattern)
      }),
    }

    await setupVCRForTest(page as any, 'test\\image-image2image-generate.spec.ts', '上传输入图并在对比模式下生成 original+optimized 两张图')

    expect(patterns.some((pattern) => String(pattern).includes('dashscope\\.aliyuncs\\.com'))).toBe(true)
  })

  it('replays legacy deepseek optimize fixtures even when the current request now sends multimodal messages with an attached image', async () => {
    fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-optimizer-vcr-'))

    vi.stubEnv('E2E_VCR_MODE', 'replay')
    vi.stubEnv('E2E_VCR_FIXTURE_DIR', fixtureDir)

    const testName = 'test\\image-image2image-generate.spec.ts'
    const testCase = '上传输入图并在对比模式下生成 original+optimized 两张图'

    const fixturePath = path.join(
      fixtureDir,
      sanitizeFixtureSegment(testName),
      `${sanitizeFixtureSegment(testCase)}.json`
    )

    await fs.mkdir(path.dirname(fixturePath), { recursive: true })
    await fs.writeFile(
      fixturePath,
      JSON.stringify(
        {
          testName,
          testCase,
          interactions: [
            {
              provider: 'deepseek',
              url: 'https://api.deepseek.com/v1/chat/completions',
              method: 'POST',
              requestBody: {
                model: 'deepseek-chat',
                messages: [
                  {
                    role: 'system',
                    content: '# Role: Image-to-Image Prompt Optimization Expert\n\nLegacy system prompt body',
                  },
                  {
                    role: 'user',
                    content:
                      'Please optimize the following image modification request into natural-language Image-to-Image prompt.\n\nModification request to optimize:\nmake it watercolor style\n\nPlease output precise Image-to-Image optimization prompt:',
                  },
                ],
                stream: true,
              },
              requestHash: 'legacy-text-only-deepseek-hash',
              rawBody: 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',
              responseHeaders: { 'content-type': 'text/event-stream' },
              responseBody: null,
              duration: 10,
              status: 200,
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    )

    const handlers: Array<(route: any) => Promise<void>> = []
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const page = {
      route: vi.fn(async (_pattern: unknown, handler: (route: any) => Promise<void>) => {
        handlers.push(handler)
      }),
    }

    await setupVCRForTest(page as any, testName, testCase)

    const deepseekHandler = handlers[1]
    expect(deepseekHandler).toBeTypeOf('function')

    const route = createFakeRoute({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            '# Role: Image-to-Image Prompt Optimization Expert\n\nThe current image to edit is attached directly with the request.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Please optimize the following image modification request into natural-language Image-to-Image prompt.\n\nImage-to-Image modification-request evidence (JSON):\n{\n  "originalPrompt": "make it watercolor style"\n}\n\nPlease output precise Image-to-Image optimization prompt:',
            },
            {
              type: 'image_url',
              image_url: {
                url: 'data:image/png;base64,current-runtime-image',
              },
            },
          ],
        },
      ],
      stream: true,
    })

    await deepseekHandler(route as any)

    expect(() => throwIfCurrentTestHasVCRFailure()).not.toThrow()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(route.abort).not.toHaveBeenCalled()
    expect(route.continue).not.toHaveBeenCalled()
    expect(route.fulfill).toHaveBeenCalledOnce()
    expect(route.fulfill).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        headers: expect.objectContaining({
          'content-type': 'text/event-stream',
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
        }),
      }),
    )
  })
})
