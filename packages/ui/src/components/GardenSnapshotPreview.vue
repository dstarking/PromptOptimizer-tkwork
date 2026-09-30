<template>
  <div data-testid="favorite-garden-snapshot-preview">
    <NSpace vertical size="medium">
      <NDivider v-if="!sourceOnly" style="margin: 0;" />

      <NSpace v-if="!sourceOnly" vertical size="small">
        <NText strong>{{ t('favorites.manager.preview.garden.snapshotTitle') }}</NText>
        <NText depth="3">{{ t('favorites.manager.preview.garden.snapshotHint') }}</NText>
      </NSpace>

      <div
        v-if="sourceOnly && showBasicInfo"
        data-testid="favorite-garden-basic-info"
      >
        <NDescriptions :column="1" size="small" bordered label-placement="left">
          <NDescriptionsItem
            v-if="snapshot.importCode"
            :label="t('favorites.manager.preview.garden.importCode')"
          >
            {{ snapshot.importCode }}
          </NDescriptionsItem>

          <NDescriptionsItem
            v-if="snapshot.gardenBaseUrl"
            :label="t('favorites.manager.preview.garden.gardenBaseUrl')"
          >
            {{ snapshot.gardenBaseUrl }}
          </NDescriptionsItem>

          <NDescriptionsItem
            v-if="snapshot.schema"
            :label="t('favorites.manager.preview.garden.schema')"
          >
            {{ snapshot.schema }}
            <NText v-if="snapshot.schemaVersion !== undefined" depth="3">
              v{{ snapshot.schemaVersion }}
            </NText>
          </NDescriptionsItem>
        </NDescriptions>
      </div>

      <NCollapse
        v-else
        :expanded-names="expandedSections"
        @update:expanded-names="handleExpandedNamesUpdate"
      >
        <NCollapseItem
          v-if="showBasicInfo"
          name="basicInfo"
          :title="t('favorites.manager.preview.garden.basicInfo')"
        >
          <div data-testid="favorite-garden-basic-info">
            <NDescriptions :column="1" size="small" bordered label-placement="left">
              <NDescriptionsItem
                v-if="snapshot.importCode"
                :label="t('favorites.manager.preview.garden.importCode')"
              >
                {{ snapshot.importCode }}
              </NDescriptionsItem>

              <NDescriptionsItem
                v-if="snapshot.gardenBaseUrl"
                :label="t('favorites.manager.preview.garden.gardenBaseUrl')"
              >
                {{ snapshot.gardenBaseUrl }}
              </NDescriptionsItem>

              <NDescriptionsItem
                v-if="snapshot.schema"
                :label="t('favorites.manager.preview.garden.schema')"
              >
                {{ snapshot.schema }}
                <NText v-if="snapshot.schemaVersion !== undefined" depth="3">
                  v{{ snapshot.schemaVersion }}
                </NText>
              </NDescriptionsItem>
            </NDescriptions>
          </div>
        </NCollapseItem>

        <NCollapseItem
          v-if="showMeta"
          name="metaInfo"
          :title="t('favorites.manager.preview.garden.metaInfo')"
        >
          <div data-testid="favorite-garden-meta">
            <NSpace vertical size="small">
              <NDescriptions :column="1" size="small" bordered label-placement="left">
                <NDescriptionsItem
                  v-if="snapshot.meta.title"
                  :label="t('favorites.manager.preview.garden.title')"
                >
                  {{ snapshot.meta.title }}
                </NDescriptionsItem>

                <NDescriptionsItem
                  v-if="snapshot.meta.description"
                  :label="t('favorites.manager.preview.garden.description')"
                >
                  {{ snapshot.meta.description }}
                </NDescriptionsItem>
              </NDescriptions>

              <NSpace v-if="snapshot.meta.tags.length > 0" size="small" wrap>
                <NTag
                  v-for="tag in snapshot.meta.tags"
                  :key="`meta-tag-${tag}`"
                  size="small"
                  :bordered="false"
                  type="info"
                >
                  {{ tag }}
                </NTag>
              </NSpace>
            </NSpace>
          </div>
        </NCollapseItem>

        <NCollapseItem
          v-if="showCoverSection"
          name="cover"
          :title="t('favorites.manager.preview.garden.cover')"
        >
          <div data-testid="favorite-garden-cover">
            <NSpace vertical size="small">
              <AppPreviewImage
                v-if="snapshot.coverUrl"
                :src="snapshot.coverUrl"
                :alt="t('favorites.manager.preview.garden.cover')"
                object-fit="cover"
                width="100%"
                style="max-height: 220px;"
              />

              <NEmpty
                v-else
                size="small"
                :description="t('favorites.manager.preview.garden.noCover')"
              />

              <NSpace v-if="editable" size="small">
                <NUpload
                  data-testid="favorite-garden-cover-uploader"
                  accept="image/*"
                  :max="1"
                  :show-file-list="false"
                  :default-upload="false"
                  :custom-request="noopUploadRequest"
                  :disabled="busy"
                  @change="handleCoverUploadChange"
                >
                  <NButton
                    size="small"
                    secondary
                    :loading="busy"
                    :disabled="busy"
                  >
                    {{ t('favorites.manager.preview.garden.uploadCover') }}
                  </NButton>
                </NUpload>
              </NSpace>
            </NSpace>
          </div>
        </NCollapseItem>

        <NCollapseItem
          v-if="showShowcasesSection"
          name="showcases"
          :title="t('favorites.manager.preview.garden.showcases')"
        >
          <div data-testid="favorite-garden-showcases">
            <NSpace vertical size="small">
              <template v-if="snapshot.showcases.length > 0">
                <NCard
                  v-for="(showcase, index) in snapshot.showcases"
                  :key="showcase.id || `showcase-${index}`"
                  size="small"
                  embedded
                >
                  <NSpace vertical size="small">
                    <NText strong>
                      {{ t('favorites.manager.preview.garden.showcaseLabel', { index: index + 1 }) }}
                    </NText>

                    <NText v-if="showcase.text">{{ showcase.text }}</NText>
                    <NText v-if="showcase.description" depth="3">{{ showcase.description }}</NText>

                    <AppPreviewImageGroup v-if="showcase.images.length > 0">
                      <NGrid cols="2 s:3 m:4" responsive="screen" :x-gap="8" :y-gap="8">
                        <NGridItem
                          v-for="(url, imageIndex) in showcase.images"
                          :key="`${showcase.id || index}-image-${imageIndex}`"
                        >
                          <AppPreviewImage
                            :src="url"
                            :alt="t('favorites.manager.preview.garden.showcaseLabel', { index: index + 1 })"
                            object-fit="cover"
                            width="100%"
                            style="max-height: 220px;"
                          />
                        </NGridItem>
                      </NGrid>
                    </AppPreviewImageGroup>
                  </NSpace>
                </NCard>
              </template>

              <NEmpty
                v-else
                size="small"
                :description="t('favorites.manager.preview.garden.noShowcases')"
              />

              <NSpace v-if="editable" size="small">
                <NUpload
                  data-testid="favorite-garden-showcase-uploader"
                  accept="image/*"
                  multiple
                  :show-file-list="false"
                  :default-upload="false"
                  :custom-request="noopUploadRequest"
                  :disabled="busy"
                  @change="handleShowcaseUploadChange"
                >
                  <NButton
                    size="small"
                    secondary
                    :loading="busy"
                    :disabled="busy"
                  >
                    {{ t('favorites.manager.preview.garden.uploadShowcaseImages') }}
                  </NButton>
                </NUpload>
              </NSpace>
            </NSpace>
          </div>
        </NCollapseItem>

        <NCollapseItem
          v-if="showExamplesSection"
          name="examples"
          :title="t('favorites.manager.preview.garden.examples')"
        >
          <div data-testid="favorite-garden-examples">
            <NSpace vertical size="small">
              <NCard
                v-for="(example, index) in snapshot.examples"
                :key="example.id || `example-${index}`"
                size="small"
                embedded
              >
                <NSpace vertical size="small">
                  <NText strong>
                    {{ t('favorites.manager.preview.garden.exampleLabel', { index: index + 1 }) }}
                  </NText>

                  <NText v-if="example.text">{{ example.text }}</NText>
                  <NText v-if="example.description" depth="3">{{ example.description }}</NText>

                  <template v-if="example.images.length > 0">
                    <NText depth="3">{{ t('favorites.manager.preview.garden.exampleImages') }}</NText>
                    <AppPreviewImageGroup>
                      <NGrid cols="2 s:3 m:4" responsive="screen" :x-gap="8" :y-gap="8">
                        <NGridItem
                          v-for="(url, imageIndex) in example.images"
                          :key="`${example.id || index}-example-image-${imageIndex}`"
                        >
                          <AppPreviewImage
                            :src="url"
                            :alt="t('favorites.manager.preview.garden.exampleLabel', { index: index + 1 })"
                            object-fit="cover"
                            width="100%"
                            style="max-height: 220px;"
                          />
                        </NGridItem>
                      </NGrid>
                    </AppPreviewImageGroup>
                  </template>

                  <template v-if="parameterEntries(example).length > 0">
                    <NText depth="3">{{ t('favorites.manager.preview.garden.parameters') }}</NText>
                    <NDescriptions :column="1" size="small" bordered label-placement="left">
                      <NDescriptionsItem
                        v-for="([key, value]) in parameterEntries(example)"
                        :key="`${example.id || index}-param-${key}`"
                        :label="key"
                      >
                        {{ value }}
                      </NDescriptionsItem>
                    </NDescriptions>
                  </template>

                  <template v-if="example.inputImages.length > 0">
                    <NText depth="3">{{ t('favorites.manager.preview.garden.inputImages') }}</NText>
                    <AppPreviewImageGroup>
                      <NGrid cols="2 s:3 m:4" responsive="screen" :x-gap="8" :y-gap="8">
                        <NGridItem
                          v-for="(url, imageIndex) in example.inputImages"
                          :key="`${example.id || index}-input-image-${imageIndex}`"
                        >
                          <AppPreviewImage
                            :src="url"
                            :alt="t('favorites.manager.preview.garden.inputImages')"
                            object-fit="cover"
                            width="100%"
                            style="max-height: 220px;"
                          />
                        </NGridItem>
                      </NGrid>
                    </AppPreviewImageGroup>
                  </template>
                </NSpace>
              </NCard>
            </NSpace>
          </div>
        </NCollapseItem>

        <NCollapseItem
          v-if="showVariablesSection"
          name="variables"
          :title="t('favorites.manager.preview.garden.variables')"
        >
          <div data-testid="favorite-garden-variables">
            <NTable size="small" striped :single-line="false">
              <thead>
                <tr>
                  <th>{{ t('favorites.manager.preview.garden.variableName') }}</th>
                  <th>{{ t('favorites.manager.preview.garden.variableType') }}</th>
                  <th>{{ t('favorites.manager.preview.garden.variableRequired') }}</th>
                  <th>{{ t('favorites.manager.preview.garden.variableDefault') }}</th>
                  <th>{{ t('favorites.manager.preview.garden.variableOptions') }}</th>
                  <th>{{ t('favorites.manager.preview.garden.variableDescription') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="variable in snapshot.variables" :key="variable.name">
                  <td>{{ variable.name }}</td>
                  <td>{{ variable.type || '-' }}</td>
                  <td>
                    {{
                      variable.required
                        ? t('favorites.manager.preview.garden.requiredYes')
                        : t('favorites.manager.preview.garden.requiredNo')
                    }}
                  </td>
                  <td>{{ variable.defaultValue || '-' }}</td>
                  <td>{{ variable.options.length ? variable.options.join(', ') : '-' }}</td>
                  <td>{{ variable.description || '-' }}</td>
                </tr>
              </tbody>
            </NTable>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NSpace>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NEmpty,
  NGrid,
  NGridItem,
  NSpace,
  NUpload,
  NTag,
  NTable,
  NText,
  type UploadFileInfo,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type {
  GardenSnapshotPreview,
  GardenSnapshotPreviewAsset,
} from '../utils/garden-snapshot-preview'
import AppPreviewImage from './media/AppPreviewImage.vue'
import AppPreviewImageGroup from './media/AppPreviewImageGroup.vue'

type SectionKey = 'basicInfo' | 'metaInfo' | 'cover' | 'showcases' | 'examples' | 'variables'

const SECTION_KEYS: SectionKey[] = [
  'basicInfo',
  'metaInfo',
  'cover',
  'showcases',
  'examples',
  'variables',
]

const SECTION_KEY_SET = new Set<SectionKey>(SECTION_KEYS)

const props = withDefaults(defineProps<{
  snapshot: GardenSnapshotPreview
  editable?: boolean
  busy?: boolean
  hiddenSections?: SectionKey[]
  sourceOnly?: boolean
}>(), {
  editable: false,
  busy: false,
  hiddenSections: () => [],
  sourceOnly: false,
})

const emit = defineEmits<{
  'upload-cover': [dataUrl: string]
  'append-showcase-images': [dataUrls: string[]]
}>()

const { t } = useI18n()

const expandedSections = ref<SectionKey[]>([...SECTION_KEYS])
const hiddenSectionSet = computed(() => new Set(props.hiddenSections))

const isSectionHidden = (section: SectionKey) => hiddenSectionSet.value.has(section)

const showBasicInfo = computed(() => {
  return !isSectionHidden('basicInfo') && Boolean(props.snapshot.importCode || props.snapshot.gardenBaseUrl || props.snapshot.schema)
})

const showMeta = computed(() => {
  return !isSectionHidden('metaInfo') && Boolean(
    props.snapshot.meta.title ||
      props.snapshot.meta.description ||
      props.snapshot.meta.tags.length > 0,
  )
})

const showCoverSection = computed(() => {
  return !isSectionHidden('cover') && Boolean(props.snapshot.coverUrl || props.editable)
})

const showShowcasesSection = computed(() => {
  return !isSectionHidden('showcases') && Boolean(props.snapshot.showcases.length > 0 || props.editable)
})

const showExamplesSection = computed(() => {
  return !isSectionHidden('examples') && props.snapshot.examples.length > 0
})

const showVariablesSection = computed(() => {
  return !isSectionHidden('variables') && props.snapshot.variables.length > 0
})

const parameterEntries = (asset: GardenSnapshotPreviewAsset): Array<[string, string]> => {
  return Object.entries(asset.parameters)
}

type UploadChangeParam = {
  file: UploadFileInfo | null
  fileList: UploadFileInfo[]
  event?: Event
}

const noopUploadRequest = () => {
  return undefined
}

const handleExpandedNamesUpdate = (names: Array<string | number>) => {
  const parsed = names.filter((item): item is SectionKey => {
    return typeof item === 'string' && SECTION_KEY_SET.has(item as SectionKey)
  })
  expandedSections.value = parsed
}

const toImageFiles = (items: Array<UploadFileInfo | null | undefined>): File[] => {
  return items
    .map((item) => item?.file)
    .filter((file): file is File => file instanceof File && file.type.startsWith('image/'))
}

const dedupeStrings = (items: string[]): string[] => {
  return Array.from(new Set(items.filter(Boolean)))
}

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

const handleCoverUploadChange = async (options: UploadChangeParam) => {
  if (props.busy) return

  const files = toImageFiles([options.file])
  if (files.length === 0) return

  const dataUrl = await readFileAsDataUrl(files[0])
  if (dataUrl) {
    emit('upload-cover', dataUrl)
  }
}

const handleShowcaseUploadChange = async (options: UploadChangeParam) => {
  if (props.busy) return

  const files = toImageFiles((options.fileList || []).length > 0 ? options.fileList : [options.file])
  if (files.length === 0) return

  const dataUrls = await Promise.all(files.map((file) => readFileAsDataUrl(file)))
  const validUrls = dedupeStrings(dataUrls.filter((item) => Boolean(item)))
  if (validUrls.length > 0) {
    emit('append-showcase-images', validUrls)
  }
}
</script>
