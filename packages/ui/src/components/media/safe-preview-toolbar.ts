import { Fragment, h, type Ref, type VNode, type VNodeChild } from 'vue'
import type { ImageRenderToolbar, ImageRenderToolbarProps } from 'naive-ui/es/image/src/public-types'

import { downloadImageSource } from '../../utils/image-download'
import ThemedTooltip from '../common/ThemedTooltip.vue'

type SafePreviewToolbarOptions = {
  clsPrefixRef: Ref<string>
  showToolbarTooltip: boolean
  downloadLabel: string
  includeNavigation: boolean
  userRenderToolbar?: ImageRenderToolbar
  resolveDownloadSource: () => string | null | undefined
  resolveDownloadFilename?: () => string | undefined
}

const renderDefaultToolbar = (
  nodes: ImageRenderToolbarProps['nodes'],
  includeNavigation: boolean,
): VNodeChild => {
  const items: VNode[] = []

  if (includeNavigation) {
    items.push(nodes.prev, nodes.next)
  }

  items.push(
    nodes.rotateCounterclockwise,
    nodes.rotateClockwise,
    nodes.resizeToOriginalSize,
    nodes.zoomOut,
    nodes.zoomIn,
    nodes.download,
    nodes.close,
  )

  return h(Fragment, null, items)
}

const renderDownloadIcon = () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    },
    [
      h('path', {
        d: 'M12 3v11.25',
      }),
      h('path', {
        d: 'm16.5 10.5-4.5 4.5-4.5-4.5',
      }),
      h('path', {
        d: 'M4.5 16.5v1.125A2.625 2.625 0 0 0 7.125 20.25h9.75A2.625 2.625 0 0 0 19.5 17.625V16.5',
      }),
    ],
  )

export const resolveActivePreviewImageSource = (clsPrefix: string): string | null => {
  if (typeof document === 'undefined') return null
  const image = document.querySelector<HTMLImageElement>(`.${clsPrefix}-image-preview`)
  return image?.currentSrc || image?.src || null
}

export const createSafeImageToolbarRenderer = (
  options: SafePreviewToolbarOptions,
): ImageRenderToolbar => {
  const renderDownloadNode = () => {
    const iconNode = h(
      'i',
      {
        class: `${options.clsPrefixRef.value}-base-icon`,
        role: 'button',
        'aria-label': options.downloadLabel,
        onClick: (event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          const source = options.resolveDownloadSource()
          void downloadImageSource(source, {
            filename: options.resolveDownloadFilename?.(),
          })
        },
      },
      renderDownloadIcon(),
    )

    if (!options.showToolbarTooltip) {
      return iconNode
    }

    return h(
      ThemedTooltip,
      {
        label: options.downloadLabel,
        to: false,
        keepAliveOnHover: false,
      },
      {
        default: () => iconNode,
      },
    )
  }

  return (toolbarProps: ImageRenderToolbarProps) => {
    const mergedNodes = {
      ...toolbarProps.nodes,
      download: renderDownloadNode(),
    }

    if (options.userRenderToolbar) {
      return options.userRenderToolbar({ nodes: mergedNodes })
    }

    return renderDefaultToolbar(mergedNodes, options.includeNavigation)
  }
}
