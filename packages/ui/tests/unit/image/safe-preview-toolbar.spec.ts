import { describe, expect, it, vi } from 'vitest'
import { ref, h, type VNode } from 'vue'
import type { ImageRenderToolbarProps } from 'naive-ui/es/image/src/public-types'

const { downloadImageSource } = vi.hoisted(() => ({
  downloadImageSource: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../src/utils/image-download', () => ({
  downloadImageSource,
}))

import { createSafeImageToolbarRenderer } from '../../../src/components/media/safe-preview-toolbar'

const createToolbarProps = (): ImageRenderToolbarProps => ({
  nodes: {
    prev: h('span', 'prev'),
    next: h('span', 'next'),
    rotateCounterclockwise: h('span', 'rotateCounterclockwise'),
    rotateClockwise: h('span', 'rotateClockwise'),
    resizeToOriginalSize: h('span', 'resizeToOriginalSize'),
    zoomOut: h('span', 'zoomOut'),
    zoomIn: h('span', 'zoomIn'),
    download: h('span', 'download'),
    close: h('span', 'close'),
  },
})

describe('safe preview toolbar', () => {
  it('renders the replacement download node with the same base icon hit area class as Naive UI', () => {
    const renderer = createSafeImageToolbarRenderer({
      clsPrefixRef: ref('n'),
      showToolbarTooltip: false,
      downloadLabel: '下载',
      includeNavigation: false,
      userRenderToolbar: ({ nodes }) => nodes.download,
      resolveDownloadSource: () => 'data:image/png;base64,QUJD',
    })

    const node = renderer(createToolbarProps()) as VNode

    expect(node.type).toBe('i')
    expect(node.props).toMatchObject({
      class: 'n-base-icon',
    })
    expect(node.props?.onClick).toBeTypeOf('function')
  })

  it('downloads the resolved source when the replacement node is clicked', async () => {
    downloadImageSource.mockClear()

    const renderer = createSafeImageToolbarRenderer({
      clsPrefixRef: ref('n'),
      showToolbarTooltip: false,
      downloadLabel: '下载',
      includeNavigation: false,
      userRenderToolbar: ({ nodes }) => nodes.download,
      resolveDownloadSource: () => 'data:image/png;base64,QUJD',
      resolveDownloadFilename: () => 'preview.png',
    })

    const node = renderer(createToolbarProps()) as VNode
    const clickEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent

    await node.props?.onClick?.(clickEvent)

    expect(clickEvent.preventDefault).toHaveBeenCalledOnce()
    expect(clickEvent.stopPropagation).toHaveBeenCalledOnce()
    expect(downloadImageSource).toHaveBeenCalledWith('data:image/png;base64,QUJD', {
      filename: 'preview.png',
    })
  })
})
