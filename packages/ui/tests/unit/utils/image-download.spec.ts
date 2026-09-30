import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildImageDownloadFilename,
  downloadImageSource,
} from '../../../src/utils/image-download'

describe('downloadImageSource', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds timestamped filenames with the prompt-optimizer prefix by default', () => {
    expect(
      buildImageDownloadFilename({
        src: 'data:image/png;base64,QUJD',
        now: new Date(2026, 3, 2, 15, 16, 17, 89),
      }),
    ).toBe('prompt-optimizer-20260402-151617-089.png')

    expect(
      buildImageDownloadFilename({
        src: 'https://cdn.example.com/assets/render.final.webp?token=abc',
        now: new Date(2026, 3, 2, 15, 16, 17, 89),
      }),
    ).toBe('prompt-optimizer-20260402-151617-089.webp')
  })

  it('forces a named blob download for data urls instead of navigating to the data source', async () => {
    const originalCreateElement = document.createElement.bind(document)
    const anchor = originalCreateElement('a')
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined)
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return anchor
        }
        return originalCreateElement(tagName)
      })

    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    const createObjectURL = vi.fn(() => 'blob:preview-download')
    const revokeObjectURL = vi.fn()

    await downloadImageSource('data:image/png;base64,QUJD', {
      now: new Date(2026, 3, 2, 15, 16, 17, 89),
      urlApi: {
        createObjectURL,
        revokeObjectURL,
      },
    })

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(anchor.href).toBe('blob:preview-download')
    expect(anchor.download).toBe('prompt-optimizer-20260402-151617-089.png')
    expect(anchor.rel).toBe('noopener')
    expect(click).toHaveBeenCalledTimes(1)
    expect(appendChildSpy).toHaveBeenCalledWith(anchor)
    expect(removeChildSpy).toHaveBeenCalledWith(anchor)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-download')
  })
})
