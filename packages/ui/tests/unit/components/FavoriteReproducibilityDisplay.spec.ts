import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import FavoriteReproducibilityDisplay from '../../../src/components/FavoriteReproducibilityDisplay.vue'

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string, values?: Record<string, unknown>) =>
        values?.index ? `${key} ${values.index}` : key,
    }),
  }
})

const naiveStubs = {
  NButton: {
    name: 'NButton',
    template: '<button class="n-button" @click="$emit(\'click\', $event)"><slot name="icon" /><slot /></button>',
    emits: ['click'],
  },
  NCard: {
    name: 'NCard',
    template: '<section class="n-card"><slot /></section>',
    props: ['size', 'embedded'],
  },
  NDescriptions: {
    name: 'NDescriptions',
    template: '<dl class="n-descriptions"><slot /></dl>',
    props: ['column', 'size', 'bordered', 'labelPlacement'],
  },
  NDescriptionsItem: {
    name: 'NDescriptionsItem',
    template: '<div class="n-descriptions-item"><dt>{{ label }}</dt><dd><slot /></dd></div>',
    props: ['label'],
  },
  NEmpty: {
    name: 'NEmpty',
    template: '<div class="n-empty">{{ description }}</div>',
    props: ['description', 'size'],
  },
  NIcon: {
    name: 'NIcon',
    template: '<i class="n-icon"><slot /></i>',
  },
  NSpace: {
    name: 'NSpace',
    template: '<div class="n-space"><slot /></div>',
    props: ['vertical', 'size', 'align', 'wrap'],
  },
  NTable: {
    name: 'NTable',
    template: '<table class="n-table"><slot /></table>',
    props: ['size', 'striped', 'singleLine'],
  },
  NTag: {
    name: 'NTag',
    template: '<span class="n-tag"><slot /></span>',
    props: ['size', 'type', 'bordered'],
  },
  NText: {
    name: 'NText',
    template: '<span class="n-text"><slot /></span>',
    props: ['depth', 'strong'],
  },
  AppPreviewImage: {
    name: 'AppPreviewImage',
    template: '<img class="app-preview-image" :src="src" :alt="alt" />',
    props: ['src', 'alt', 'objectFit', 'class'],
  },
  AppPreviewImageGroup: {
    name: 'AppPreviewImageGroup',
    template: '<div class="app-preview-image-group"><slot /></div>',
  },
}

describe('FavoriteReproducibilityDisplay', () => {
  const reproducibilityWithExample = {
    source: 'reproducibility' as const,
    variables: [],
    examples: [
      {
        id: 'case-1',
        parameters: {},
        images: [],
        imageAssetIds: [],
        inputImages: [],
        inputImageAssetIds: [],
      },
    ],
    variableCount: 0,
    exampleCount: 1,
    hasInputImages: false,
    hasData: true,
  }

  it('keeps example application hidden unless explicitly enabled', async () => {
    const wrapper = mount(FavoriteReproducibilityDisplay, {
      props: {
        reproducibility: reproducibilityWithExample,
      },
      global: {
        stubs: naiveStubs,
      },
    })

    expect(wrapper.find('[data-testid="favorite-repro-example-apply-0"]').exists()).toBe(false)

    await wrapper.setProps({ showApplyExample: true })
    await wrapper.find('[data-testid="favorite-repro-example-apply-0"]').trigger('click')

    expect(wrapper.emitted('apply-example')).toEqual([
      [
        {
          exampleId: 'case-1',
          exampleIndex: 0,
        },
      ],
    ])
  })

  it('renders example images and input images from resolved asset previews', () => {
    const wrapper = mount(FavoriteReproducibilityDisplay, {
      props: {
        reproducibility: {
          source: 'reproducibility',
          variables: [],
          examples: [
            {
              id: 'case-1',
              parameters: {},
              images: [],
              imageAssetIds: ['asset-output'],
              inputImages: [],
              inputImageAssetIds: ['asset-input'],
            },
          ],
          variableCount: 0,
          exampleCount: 1,
          hasInputImages: true,
          hasData: true,
        },
        examplePreviews: [
          {
            images: [{ assetId: 'asset-output', source: 'data:image/png;base64,output-preview' }],
            inputImages: [{ assetId: 'asset-input', source: 'data:image/png;base64,input-preview' }],
          },
        ],
      },
      global: {
        stubs: naiveStubs,
      },
    })

    expect(wrapper.findAll('.app-preview-image').map((image) => image.attributes('src'))).toEqual([
      'data:image/png;base64,output-preview',
      'data:image/png;base64,input-preview',
    ])
  })
})
