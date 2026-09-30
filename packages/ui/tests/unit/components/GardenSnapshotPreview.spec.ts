import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { UploadFileInfo } from 'naive-ui'

import GardenSnapshotPreview from '../../../src/components/GardenSnapshotPreview.vue'
import type { GardenSnapshotPreview as GardenSnapshotPreviewData } from '../../../src/utils/garden-snapshot-preview'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params && typeof params.index === 'number') {
        return `${key}:${params.index}`
      }
      return key
    },
  }),
}))

const createSnapshot = (): GardenSnapshotPreviewData => ({
  schema: 'prompt-garden.prompt.v1',
  schemaVersion: 1,
  importCode: 'IMP-100',
  gardenBaseUrl: 'https://garden.example.com',
  importedAt: '2026-01-01T00:00:00.000Z',
  meta: {
    title: 'Snapshot Title',
    description: 'Snapshot Description',
    tags: ['portrait', 'lighting'],
  },
  coverUrl: 'https://cdn.example.com/cover.png',
  variables: [
    {
      name: 'style',
      type: 'enum',
      required: true,
      defaultValue: 'cinematic',
      options: ['cinematic', 'anime'],
      description: 'Output style',
    },
  ],
  showcases: [
    {
      id: 'showcase-1',
      text: 'Showcase text',
      description: 'Showcase description',
      images: ['https://cdn.example.com/showcase.png'],
      inputImages: [],
      parameters: {},
    },
  ],
  examples: [
    {
      id: 'example-1',
      text: 'Example text',
      description: 'Example description',
      images: ['https://cdn.example.com/example.png'],
      inputImages: ['https://cdn.example.com/input.png'],
      parameters: {
        width: '1024',
      },
    },
  ],
})

describe('GardenSnapshotPreview', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders snapshot sections with assets, variables and example details', () => {
    const wrapper = mount(GardenSnapshotPreview, {
      props: {
        snapshot: createSnapshot(),
      },
    })

    expect(wrapper.find('[data-testid="favorite-garden-snapshot-preview"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('IMP-100')
    expect(wrapper.text()).toContain('https://garden.example.com')
    expect(wrapper.text()).toContain('Snapshot Title')
    expect(wrapper.text()).toContain('Snapshot Description')

    const images = wrapper.findAll('img')
    expect(images.length).toBe(4)

    expect(wrapper.find('[data-testid="favorite-garden-showcases"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="favorite-garden-examples"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="favorite-garden-variables"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('width')
    expect(wrapper.text()).toContain('1024')
  })

  it('keeps optional sections hidden when snapshot data is minimal', () => {
    const wrapper = mount(GardenSnapshotPreview, {
      props: {
        snapshot: {
          meta: {
            tags: [],
          },
          variables: [],
          showcases: [],
          examples: [],
          importCode: 'IMP-MIN',
        },
      },
    })

    expect(wrapper.text()).toContain('IMP-MIN')
    expect(wrapper.find('[data-testid="favorite-garden-cover"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-showcases"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-examples"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-variables"]').exists()).toBe(false)
  })

  it('can hide sections already promoted by the favorite detail panel', () => {
    const wrapper = mount(GardenSnapshotPreview, {
      props: {
        snapshot: createSnapshot(),
        hiddenSections: ['metaInfo', 'cover', 'showcases', 'examples', 'variables'],
      },
    })

    expect(wrapper.text()).toContain('IMP-100')
    expect(wrapper.find('[data-testid="favorite-garden-meta"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-cover"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-showcases"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-examples"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-variables"]').exists()).toBe(false)
  })

  it('renders source-only mode without the nested snapshot header or collapse sections', () => {
    const wrapper = mount(GardenSnapshotPreview, {
      props: {
        snapshot: createSnapshot(),
        sourceOnly: true,
      },
    })

    expect(wrapper.find('[data-testid="favorite-garden-basic-info"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('IMP-100')
    expect(wrapper.text()).toContain('https://garden.example.com')
    expect(wrapper.text()).not.toContain('favorites.manager.preview.garden.snapshotTitle')
    expect(wrapper.find('.n-collapse').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-examples"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="favorite-garden-variables"]').exists()).toBe(false)
  })

  it('supports image zoom and local upload actions in editable mode', async () => {
    class MockFileReader {
      public result: string | null = null
      public onload: ((event: Event) => void) | null = null
      public onerror: ((event: Event) => void) | null = null

      readAsDataURL() {
        this.result = 'data:image/png;base64,dGVzdA=='
        this.onload?.(new Event('load'))
      }
    }

    vi.stubGlobal('FileReader', MockFileReader)

    const wrapper = mount(GardenSnapshotPreview, {
      props: {
        snapshot: createSnapshot(),
        editable: true,
      },
    })

    expect(wrapper.findAll('.n-image').length).toBeGreaterThan(0)

    const coverFile = new File(['cover'], 'cover.png', { type: 'image/png' })
    const showcaseFile = new File(['shot'], 'shot.png', { type: 'image/png' })

    await (wrapper.vm as unknown as {
      handleCoverUploadChange: (arg: { file: UploadFileInfo | null; fileList: UploadFileInfo[] }) => Promise<void>
      handleShowcaseUploadChange: (arg: { file: UploadFileInfo | null; fileList: UploadFileInfo[] }) => Promise<void>
    }).handleCoverUploadChange({
      file: { file: coverFile } as UploadFileInfo,
      fileList: [{ file: coverFile } as UploadFileInfo],
    })

    await (wrapper.vm as unknown as {
      handleShowcaseUploadChange: (arg: { file: UploadFileInfo | null; fileList: UploadFileInfo[] }) => Promise<void>
    }).handleShowcaseUploadChange({
      file: { file: showcaseFile } as UploadFileInfo,
      fileList: [{ file: showcaseFile } as UploadFileInfo],
    })

    const coverEvent = wrapper.emitted('upload-cover')
    expect(coverEvent).toBeTruthy()
    const coverPayload = coverEvent?.[0]?.[0] as string | undefined
    expect(String(coverPayload || '')).toMatch(/^data:image\/png;base64,/)

    const showcaseEvent = wrapper.emitted('append-showcase-images')
    expect(showcaseEvent).toBeTruthy()
    const showcasePayload = showcaseEvent?.[0]?.[0] as string[] | undefined
    expect(Array.isArray(showcasePayload)).toBe(true)
    expect(String(showcasePayload?.[0] || '')).toMatch(/^data:image\/png;base64,/)
  })
})
