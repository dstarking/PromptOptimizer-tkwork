import { describe, expect, it, vi } from 'vitest'

import {
  assertImageResourceRestoreReportSafe,
  createFullImageDataFromResource,
  restoreImageResource,
  safeImageResourceFileName,
  validateImageResourceBytes,
} from '../../../src/utils/image-resource-backup'

const sha256Hex = async (bytes: Uint8Array): Promise<string> => {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

describe('image resource backup helpers', () => {
  it('creates stable safe file names with optional content hashes', () => {
    expect(safeImageResourceFileName('cover asset', 'image/png')).toBe('cover%20asset.png')
    expect(safeImageResourceFileName('cover asset', 'image/png', 'abc')).toBe('cover%20asset.abc.png')
  })

  it('validates image bytes with sha256 before size fallback', async () => {
    const bytes = new TextEncoder().encode('image-bytes')

    await expect(validateImageResourceBytes({
      kind: 'image',
      id: 'asset-1',
      path: 'resources/images/asset-1.png',
      sha256: await sha256Hex(bytes),
      sizeBytes: 999,
    }, bytes)).resolves.toBe('ok')

    await expect(validateImageResourceBytes({
      kind: 'image',
      id: 'asset-1',
      path: 'resources/images/asset-1.png',
      sha256: 'wrong',
      sizeBytes: bytes.byteLength,
    }, bytes)).resolves.toBe('corrupt')
  })

  it('centralizes restore-failure errors and byte-to-image reconstruction', () => {
    expect(() => assertImageResourceRestoreReportSafe({
      restored: 0,
      skipped: 0,
      missing: ['asset-1'],
      corrupt: [],
      errors: [],
    }, 'Favorite package')).toThrow('Favorite package resource validation failed: missing=1')

    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    const image = createFullImageDataFromResource({
      kind: 'image',
      id: 'asset-2',
      path: 'resources/images/asset-2.png',
      mimeType: 'image/png',
      createdAt: 1,
      source: 'generated',
    }, jpegBytes)

    expect(image.metadata.mimeType).toBe('image/jpeg')
    expect(image.metadata.source).toBe('generated')
  })

  it('skips only when local storage can return complete image bytes', async () => {
    const bytes = new TextEncoder().encode('backup-image')
    const entry = {
      kind: 'image' as const,
      id: 'asset-3',
      path: 'resources/images/asset-3.png',
      mimeType: 'image/png',
      createdAt: 1,
      source: 'uploaded' as const,
    }
    const saveImage = vi.fn(async () => 'asset-3')
    const metadataOnlyStorage = {
      getImage: vi.fn(async () => null),
      saveImage,
    }

    await expect(restoreImageResource(entry, bytes, metadataOnlyStorage)).resolves.toBe('restored')
    expect(saveImage).toHaveBeenCalledTimes(1)

    const completeStorage = {
      getImage: vi.fn(async () => ({
        metadata: {
          id: 'asset-3',
          mimeType: 'image/png',
          sizeBytes: 1,
          createdAt: 1,
          source: 'uploaded' as const,
        },
        data: 'x',
      })),
      saveImage: vi.fn(async () => 'asset-3'),
    }

    await expect(restoreImageResource(entry, bytes, completeStorage)).resolves.toBe('skipped')
    expect(completeStorage.saveImage).not.toHaveBeenCalled()
  })
})
