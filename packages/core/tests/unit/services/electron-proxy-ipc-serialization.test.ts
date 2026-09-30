import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ElectronPromptServiceProxy } from '../../../src/services/prompt/electron-proxy'

const servicesDir = join(process.cwd(), 'src', 'services')

const findElectronProxyFiles = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findElectronProxyFiles(fullPath))
    } else if (entry.isFile() && entry.name === 'electron-proxy.ts') {
      files.push(fullPath)
    }
  }

  return files
}

const SERIALIZATION_REQUIRED = [
  /:\s*ImageRequest\b/,
  /:\s*Text2ImageRequest\b/,
  /:\s*Image2ImageRequest\b/,
  /:\s*MultiImageGenerationRequest\b/,
  /:\s*MultiImageRequest\b/,
  /:\s*ImageModelConfig\b/,
  /:\s*Partial<ImageModelConfig>\b/,
  /:\s*Record<string,\s*(?:unknown|any)>\b/,
  /:\s*unknown\b/,
  /:\s*any\b/,
  /\.\.\.args:\s*any\[\]/,
]

const SAFE_SERIALIZATION = /safeSerializeForIPC|safeSerializeArgs/

describe('Electron proxy IPC serialization guard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses shared IPC serialization in proxies that accept complex payloads', () => {
    const offenders = findElectronProxyFiles(servicesDir)
      .map((path) => ({
        path,
        content: readFileSync(path, 'utf8'),
      }))
      .filter(({ content }) => SERIALIZATION_REQUIRED.some((pattern) => pattern.test(content)))
      .filter(({ content }) => !SAFE_SERIALIZATION.test(content))
      .map(({ path }) => relative(process.cwd(), path))

    expect(offenders).toEqual([])
  })

  it('serializes optional test images without changing their raw base64 shape', async () => {
    const testPrompt = vi.fn(async (..._args: unknown[]) => 'answer')
    const testPromptStream = vi.fn(async (..._args: unknown[]) => {})
    vi.stubGlobal('window', {
      electronAPI: {
        prompt: {
          testPrompt,
          testPromptStream,
        },
      },
    })

    const proxy = new ElectronPromptServiceProxy()
    const inputImages = [{ b64: 'RAW_IMAGE_PAYLOAD', mimeType: 'image/jpeg' }]
    const callbacks = {
      onToken: vi.fn(),
      onComplete: vi.fn(),
      onError: vi.fn(),
    }

    await expect(proxy.testPrompt('system', 'question', 'model', inputImages))
      .resolves.toBe('answer')
    await proxy.testPromptStream('system', 'question', 'model', callbacks, inputImages)

    const serializedNonStream = testPrompt.mock.calls[0][3] as Array<{ b64: string; mimeType?: string }>
    const serializedStream = testPromptStream.mock.calls[0][4] as Array<{ b64: string; mimeType?: string }>
    expect(serializedNonStream).toEqual(inputImages)
    expect(serializedStream).toEqual(inputImages)
    expect(serializedNonStream).not.toBe(inputImages)
    expect(serializedStream).not.toBe(inputImages)
    expect(serializedNonStream[0].b64).toBe('RAW_IMAGE_PAYLOAD')
    expect(serializedStream[0].b64).not.toMatch(/^data:/)
  })
})
