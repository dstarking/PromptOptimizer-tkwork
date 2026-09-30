<template>
  <div class="tiktok-product-card-workspace">
    <div class="tiktok-product-card-header">
      <div>
        <NText tag="h1" class="tiktok-product-card-title">
          {{ t('tiktokProductCard.title') }}
        </NText>
        <NText depth="3">{{ t('tiktokProductCard.subtitle') }}</NText>
      </div>

      <div class="tiktok-product-card-model">
        <NText depth="3">{{ t('tiktokProductCard.model') }}</NText>
        <TextModelQuickSwitch
          :model-key="modelSelection.selectedOptimizeModelKey"
          :options="modelSelection.textModelOptions.value"
          :refresh-models="modelSelection.refreshTextModels"
          :disabled="isGenerating"
        />
        <SelectWithConfig
          v-model="modelSelection.selectedOptimizeModelKey"
          :options="modelSelection.textModelOptions"
          :get-primary="OptionAccessors.getPrimary"
          :get-secondary="OptionAccessors.getSecondary"
          :get-value="OptionAccessors.getValue"
          :placeholder="t('model.select.placeholder')"
          :disabled="isGenerating"
          :show-config-action="true"
          :show-empty-config-c-t-a="true"
          @focus="modelSelection.refreshTextModels"
          @config="() => openModelManager('text')"
        />
      </div>
    </div>

    <div class="tiktok-product-card-grid">
      <NCard class="tiktok-product-card-input" :title="t('tiktokProductCard.inputTitle')">
        <NAlert type="info" :show-icon="false" class="tiktok-product-card-context">
          <div class="context-grid">
            <span><strong>{{ t('tiktokProductCard.platform') }}:</strong> {{ t('tiktokProductCard.platformValue') }}</span>
            <span><strong>{{ t('tiktokProductCard.market') }}:</strong> {{ t('tiktokProductCard.marketValue') }}</span>
            <span><strong>{{ t('tiktokProductCard.category') }}:</strong> {{ t('tiktokProductCard.categoryValue') }}</span>
          </div>
        </NAlert>

        <div class="tiktok-product-card-section-heading">
          <NText strong>{{ t('tiktokProductCard.imageRequired') }}</NText>
          <NText depth="3" class="tiktok-product-card-image-count">
            {{ t('tiktokProductCard.selectedImages', { count: uploadedImages.length }) }}
          </NText>
        </div>

        <input
          ref="fileInputRef"
          class="tiktok-product-card-file-input"
          type="file"
          accept="image/png,image/jpeg"
          multiple
          @change="handleFileSelection"
        />
        <button
          type="button"
          class="tiktok-product-card-upload"
          :disabled="isPreparingImages || uploadedImages.length >= MAX_PRODUCT_IMAGES"
          data-testid="tiktok-product-card-upload"
          @click="openFilePicker"
        >
          <NText strong>{{ t('tiktokProductCard.uploadImages') }}</NText>
          <NText depth="3">{{ t('tiktokProductCard.uploadHint') }}</NText>
        </button>

        <div v-if="uploadedImages.length" class="tiktok-product-card-image-grid">
          <div v-for="image in uploadedImages" :key="image.id" class="tiktok-product-card-image-item">
            <img :src="image.previewUrl" :alt="image.name" />
            <div class="tiktok-product-card-image-meta">
              <NText depth="2" :title="image.name">{{ image.name }}</NText>
              <NButton
                text
                size="tiny"
                type="error"
                :aria-label="t('tiktokProductCard.removeImage')"
                @click="removeImage(image.id)"
              >
                ×
              </NButton>
            </div>
          </div>
        </div>

        <NDivider />

        <div class="tiktok-product-card-section-heading">
          <NText strong>{{ t('tiktokProductCard.optionalInputs') }}</NText>
        </div>
        <NForm label-placement="top" class="tiktok-product-card-form">
          <NFormItem :label="t('tiktokProductCard.productTitle')">
            <NInput
              v-model:value="productTitle"
              :placeholder="t('tiktokProductCard.productTitlePlaceholder')"
              :disabled="isGenerating"
              data-testid="tiktok-product-card-product-title"
            />
          </NFormItem>
          <NFormItem :label="t('tiktokProductCard.specifications')">
            <NInput
              v-model:value="specifications"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 7 }"
              :placeholder="t('tiktokProductCard.specificationsPlaceholder')"
              :disabled="isGenerating"
            />
          </NFormItem>
          <NFormItem :label="t('tiktokProductCard.supplierDescription')">
            <NInput
              v-model:value="supplierDescription"
              type="textarea"
              :autosize="{ minRows: 4, maxRows: 10 }"
              :placeholder="t('tiktokProductCard.supplierDescriptionPlaceholder')"
              :disabled="isGenerating"
            />
          </NFormItem>
        </NForm>

        <div class="tiktok-product-card-actions">
          <NButton tertiary :disabled="isGenerating" @click="clearCurrentInput">
            {{ t('tiktokProductCard.clear') }}
          </NButton>
          <NButton
            type="primary"
            :loading="isGenerating"
            :disabled="isPreparingImages"
            data-testid="tiktok-product-card-generate"
            @click="generateProductCard"
          >
            {{ isGenerating ? t('tiktokProductCard.generating') : t('tiktokProductCard.generate') }}
          </NButton>
        </div>
      </NCard>

      <NCard class="tiktok-product-card-result" :title="t('tiktokProductCard.resultTitle')">
        <template #header-extra>
          <div class="tiktok-product-card-result-actions">
            <NButton
              size="small"
              tertiary
              :disabled="!outputText.trim() || isGenerating"
              @click="copyResult"
            >
              {{ t('tiktokProductCard.copy') }}
            </NButton>
            <NButton
              size="small"
              tertiary
              :disabled="!outputText.trim() || isGenerating"
              @click="exportResult"
            >
              {{ t('tiktokProductCard.download') }}
            </NButton>
            <NButton
              size="small"
              type="primary"
              ghost
              :loading="isSavingFavorite"
              :disabled="!outputText.trim() || isGenerating"
              @click="saveToFavorites"
            >
              {{ t('tiktokProductCard.saveFavorite') }}
            </NButton>
          </div>
        </template>

        <NText depth="3" class="tiktok-product-card-result-hint">
          {{ t('tiktokProductCard.resultHint') }}
        </NText>

        <NSpin :show="isGenerating && !outputText.trim()" class="tiktok-product-card-spinner">
          <NScrollbar class="tiktok-product-card-result-scroll">
            <NEmpty v-if="!outputText.trim()" :description="t('tiktokProductCard.emptyResult')" />
            <div v-else class="tiktok-product-card-sections">
              <NCard
                v-for="section in resultSections"
                :key="section.key"
                size="small"
                class="tiktok-product-card-section-card"
              >
                <template #header>
                  <NText strong>{{ section.title }}</NText>
                </template>
                <MarkdownRenderer
                  :content="section.content"
                  :streaming="isGenerating"
                  :disable-internal-scroll="true"
                />
              </NCard>
            </div>
          </NScrollbar>
        </NSpin>
      </NCard>
    </div>

    <NCard class="tiktok-product-card-history" :title="t('tiktokProductCard.historyTitle')">
      <NText depth="3" class="tiktok-product-card-history-hint">
        {{ t('tiktokProductCard.historyImagesNotSaved') }}
      </NText>
      <NEmpty v-if="historyEntries.length === 0" :description="t('tiktokProductCard.historyEmpty')" />
      <div v-else class="tiktok-product-card-history-list">
        <div v-for="entry in historyEntries" :key="entry.id" class="tiktok-product-card-history-item">
          <div class="tiktok-product-card-history-copy">
            <NText strong>{{ entry.title }}</NText>
            <NText depth="3">{{ t('tiktokProductCard.generatedAt', { time: formatHistoryTime(entry.createdAt) }) }}</NText>
          </div>
          <NButton size="small" tertiary @click="loadHistoryEntry(entry)">
            {{ t('tiktokProductCard.loadHistory') }}
          </NButton>
        </div>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, reactive, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NAlert,
  NButton,
  NCard,
  NDivider,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NScrollbar,
  NSpin,
  NText,
} from 'naive-ui'
import type { ImageInputRef } from '@prompt-optimizer/core'

import MarkdownRenderer from '../MarkdownRenderer.vue'
import SelectWithConfig from '../SelectWithConfig.vue'
import TextModelQuickSwitch from '../TextModelQuickSwitch.vue'
import { useWorkspaceModelSelection } from '../../composables/workspaces/useWorkspaceModelSelection'
import { useClipboard } from '../../composables/ui/useClipboard'
import { useImageInputPreparation } from '../../composables/image/useImageInputPreparation'
import { useToast } from '../../composables/ui/useToast'
import { OptionAccessors } from '../../utils/data-transformer'
import { fileToImageInputRef } from '../../utils/image-compression'
import { parseTikTokProductCardSections } from '../../utils/tiktok-product-card-result'
import {
  buildTikTokProductCardUserPrompt,
  TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT,
} from '../../services/tiktok-product-card-prompt'
import type { AppServices } from '../../types/services'

const MAX_PRODUCT_IMAGES = 9
const PRODUCT_CARD_HISTORY_KEY = 'session/tiktok-product-card/history/v1'
const MAX_HISTORY_ENTRIES = 20

interface UploadedProductImage {
  id: string
  name: string
  previewUrl: string
  input: ImageInputRef
}

interface ProductCardHistoryEntry {
  id: string
  title: string
  createdAt: number
  content: string
  modelKey: string
  productTitle: string
  specifications: string
  supplierDescription: string
  imageNames: string[]
}

interface ProductCardModelSession {
  selectedOptimizeModelKey: string
  selectedTestModelKey: string
  updateOptimizeModel: (value: string) => void
  updateTestModel: (value: string) => void
}

const { t, locale } = useI18n()
const toast = useToast()
const clipboard = useClipboard()
const { prepareFiles } = useImageInputPreparation()
const services = inject<Ref<AppServices | null>>('services', ref<AppServices | null>(null))
const openModelManager = inject<(tab?: 'text' | 'image' | 'function') => void>(
  'openModelManager',
  () => undefined,
)

const modelSession = reactive<ProductCardModelSession>({
  selectedOptimizeModelKey: '',
  selectedTestModelKey: '',
  updateOptimizeModel(value) {
    modelSession.selectedOptimizeModelKey = value
  },
  updateTestModel(value) {
    modelSession.selectedTestModelKey = value
  },
})
const modelSelection = useWorkspaceModelSelection(services, modelSession)

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedImages = ref<UploadedProductImage[]>([])
const productTitle = ref('')
const specifications = ref('')
const supplierDescription = ref('')
const outputText = ref('')
const reasoningText = ref('')
const isGenerating = ref(false)
const isPreparingImages = ref(false)
const isSavingFavorite = ref(false)
const historyEntries = ref<ProductCardHistoryEntry[]>([])
let generationToken = 0

const resultSections = computed(() => parseTikTokProductCardSections(outputText.value))

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const openFilePicker = () => fileInputRef.value?.click()

const handleFileSelection = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (files.length === 0) return

  const remaining = MAX_PRODUCT_IMAGES - uploadedImages.value.length
  if (remaining <= 0) {
    toast.warning(t('tiktokProductCard.tooManyImages'))
    return
  }

  if (files.length > remaining) {
    toast.warning(t('tiktokProductCard.tooManyImages'))
  }

  isPreparingImages.value = true
  try {
    const prepared = await prepareFiles(files.slice(0, remaining))
    if (!prepared) return

    const nextImages = await Promise.all(prepared.map(async (result) => ({
      id: createId(),
      name: result.file.name,
      previewUrl: URL.createObjectURL(result.file),
      input: await fileToImageInputRef(result.file),
    })))
    uploadedImages.value.push(...nextImages)
  } finally {
    isPreparingImages.value = false
  }
}

const removeImage = (id: string) => {
  const image = uploadedImages.value.find((item) => item.id === id)
  if (image) URL.revokeObjectURL(image.previewUrl)
  uploadedImages.value = uploadedImages.value.filter((item) => item.id !== id)
}

const clearUploadedImages = () => {
  uploadedImages.value.forEach((image) => URL.revokeObjectURL(image.previewUrl))
  uploadedImages.value = []
}

const clearCurrentInput = () => {
  clearUploadedImages()
  productTitle.value = ''
  specifications.value = ''
  supplierDescription.value = ''
  outputText.value = ''
  reasoningText.value = ''
}

const getGenerationTitle = () =>
  productTitle.value.trim() || 'TikTok Product Card Optimization'

const isHistoryEntry = (value: unknown): value is ProductCardHistoryEntry => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProductCardHistoryEntry>
  return Boolean(
    typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.createdAt === 'number' &&
      typeof candidate.content === 'string' &&
      typeof candidate.modelKey === 'string' &&
      typeof candidate.productTitle === 'string' &&
      typeof candidate.specifications === 'string' &&
      typeof candidate.supplierDescription === 'string' &&
      Array.isArray(candidate.imageNames),
  )
}

const loadHistory = async () => {
  const preferenceService = services.value?.preferenceService
  if (!preferenceService) return

  try {
    const stored = await preferenceService.get<unknown>(PRODUCT_CARD_HISTORY_KEY, [])
    if (Array.isArray(stored)) {
      historyEntries.value = stored.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES)
    }
  } catch (error) {
    console.warn('[TikTokProductCardWorkspace] Failed to load history:', error)
  }
}

const saveHistoryEntry = async () => {
  if (!outputText.value.trim()) return

  const entry: ProductCardHistoryEntry = {
    id: createId(),
    title: getGenerationTitle(),
    createdAt: Date.now(),
    content: outputText.value.trim(),
    modelKey: modelSelection.selectedOptimizeModelKey.value,
    productTitle: productTitle.value,
    specifications: specifications.value,
    supplierDescription: supplierDescription.value,
    imageNames: uploadedImages.value.map((image) => image.name),
  }
  historyEntries.value = [entry, ...historyEntries.value.filter((item) => item.content !== entry.content)]
    .slice(0, MAX_HISTORY_ENTRIES)

  try {
    await services.value?.preferenceService.set(PRODUCT_CARD_HISTORY_KEY, historyEntries.value)
  } catch (error) {
    console.warn('[TikTokProductCardWorkspace] Failed to save history:', error)
    toast.warning(t('tiktokProductCard.historySaveFailed'))
  }
}

const loadHistoryEntry = (entry: ProductCardHistoryEntry) => {
  outputText.value = entry.content
  reasoningText.value = ''
  productTitle.value = entry.productTitle
  specifications.value = entry.specifications
  supplierDescription.value = entry.supplierDescription
  if (entry.modelKey && modelSelection.textModelOptions.value.some((option) => option.value === entry.modelKey)) {
    modelSelection.selectedOptimizeModelKey.value = entry.modelKey
  }
}

const formatHistoryTime = (timestamp: number) => {
  try {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(timestamp)
  } catch {
    return new Date(timestamp).toLocaleString()
  }
}

const generateProductCard = async () => {
  if (uploadedImages.value.length === 0) {
    toast.warning(t('tiktokProductCard.imageRequiredError'))
    return
  }

  const promptService = services.value?.promptService
  const modelKey = modelSelection.selectedOptimizeModelKey.value
  if (!promptService || !modelKey) {
    toast.warning(t('tiktokProductCard.modelRequiredError'))
    return
  }

  const token = ++generationToken
  let historyPersisted = false
  isGenerating.value = true
  outputText.value = ''
  reasoningText.value = ''

  try {
    await promptService.testPromptStream(
      TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT,
      buildTikTokProductCardUserPrompt({
        productTitle: productTitle.value,
        specifications: specifications.value,
        supplierDescription: supplierDescription.value,
      }),
      modelKey,
      {
        onToken: (tokenText) => {
          if (token === generationToken) outputText.value += tokenText
        },
        onReasoningToken: (tokenText) => {
          if (token === generationToken) reasoningText.value += tokenText
        },
        onComplete: (response) => {
          if (token !== generationToken) return
          if (!outputText.value.trim() && response?.content) {
            outputText.value = response.content
          }
          isGenerating.value = false
          if (outputText.value.trim() && !historyPersisted) {
            historyPersisted = true
            void saveHistoryEntry()
          }
        },
        onError: (error) => {
          if (token !== generationToken) return
          isGenerating.value = false
          toast.error(t('tiktokProductCard.generateFailed', {
            error: error instanceof Error ? error.message : String(error),
          }))
        },
      },
      uploadedImages.value.map((image) => image.input),
    )

    if (token === generationToken && outputText.value.trim() && !historyPersisted) {
      historyPersisted = true
      await saveHistoryEntry()
    }
  } catch (error) {
    if (token === generationToken) {
      toast.error(t('tiktokProductCard.generateFailed', {
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  } finally {
    if (token === generationToken) isGenerating.value = false
  }
}

const copyResult = async () => {
  if (!outputText.value.trim()) {
    toast.warning(t('tiktokProductCard.noResultToSave'))
    return
  }

  try {
    await clipboard.copyText(outputText.value)
    toast.success(t('tiktokProductCard.copySuccess'))
  } catch {
    toast.error(t('tiktokProductCard.copyFailed'))
  }
}

const exportResult = () => {
  if (!outputText.value.trim()) {
    toast.warning(t('tiktokProductCard.noResultToSave'))
    return
  }

  const exportContent = [
    `# ${getGenerationTitle()}`,
    '',
    '- Platform: TikTok Shop',
    '- Market: Singapore',
    '- Category: Pet Supplies',
    `- Generated: ${formatHistoryTime(Date.now())}`,
    '',
    outputText.value.trim(),
  ].join('\n')
  const blob = new Blob([exportContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${getGenerationTitle().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'tiktok-product-card'}.md`
  anchor.click()
  URL.revokeObjectURL(url)
  toast.success(t('tiktokProductCard.exportSuccess'))
}

const saveToFavorites = async () => {
  if (!outputText.value.trim()) {
    toast.warning(t('tiktokProductCard.noResultToSave'))
    return
  }

  const favoriteManager = services.value?.favoriteManager
  if (!favoriteManager) {
    toast.error(t('toast.error.favoriteNotInitialized'))
    return
  }

  isSavingFavorite.value = true
  try {
    await favoriteManager.addFavorite({
      title: getGenerationTitle(),
      content: outputText.value.trim(),
      description: 'TikTok Shop Singapore pet-supplies product-card optimization package.',
      tags: ['TikTok Shop', 'Singapore', 'Pet Supplies'],
      functionMode: 'basic',
      optimizationMode: 'system',
      metadata: {
        tiktokProductCard: true,
        platform: 'TikTok Shop',
        market: 'Singapore',
        category: 'Pet Supplies',
        modelKey: modelSelection.selectedOptimizeModelKey.value,
        sellerInputs: {
          productTitle: productTitle.value,
          specifications: specifications.value,
          supplierDescription: supplierDescription.value,
        },
      },
    })
    toast.success(t('tiktokProductCard.favoriteSuccess'))
  } catch (error) {
    toast.error(t('tiktokProductCard.saveFailed', {
      error: error instanceof Error ? error.message : String(error),
    }))
  } finally {
    isSavingFavorite.value = false
  }
}

onMounted(async () => {
  await Promise.all([modelSelection.refreshTextModels(), loadHistory()])
})

onBeforeUnmount(() => {
  generationToken += 1
  clearUploadedImages()
})
</script>

<style scoped>
.tiktok-product-card-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 16px;
  overflow: auto;
}

.tiktok-product-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tiktok-product-card-title {
  display: block;
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 650;
}

.tiktok-product-card-model {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: min(100%, 420px);
}

.tiktok-product-card-model :deep(.swc-select) {
  min-width: 220px;
}

.tiktok-product-card-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.9fr) minmax(420px, 1.5fr);
  gap: 16px;
  min-height: 560px;
}

.tiktok-product-card-input,
.tiktok-product-card-result {
  min-width: 0;
  min-height: 0;
}

.tiktok-product-card-input :deep(.n-card__content),
.tiktok-product-card-result :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.tiktok-product-card-context {
  flex-shrink: 0;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 16px;
  font-size: 12px;
}

.tiktok-product-card-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tiktok-product-card-image-count {
  font-size: 12px;
}

.tiktok-product-card-file-input {
  display: none;
}

.tiktok-product-card-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 92px;
  padding: 16px;
  border: 1px dashed var(--n-border-color);
  border-radius: 8px;
  background: var(--n-color-embedded);
  color: var(--n-text-color);
  cursor: pointer;
  text-align: center;
}

.tiktok-product-card-upload:hover:not(:disabled) {
  border-color: var(--n-primary-color);
  background: var(--n-hover-color);
}

.tiktok-product-card-upload:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.tiktok-product-card-image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tiktok-product-card-image-item {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--n-color-embedded);
}

.tiktok-product-card-image-item img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.tiktok-product-card-image-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 3px 5px;
}

.tiktok-product-card-image-meta :deep(.n-text) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.tiktok-product-card-form {
  min-height: 0;
}

.tiktok-product-card-actions,
.tiktok-product-card-result-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.tiktok-product-card-result-hint,
.tiktok-product-card-history-hint {
  display: block;
  font-size: 12px;
  line-height: 1.45;
}

.tiktok-product-card-spinner,
.tiktok-product-card-result-scroll {
  flex: 1;
  min-height: 320px;
}

.tiktok-product-card-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.tiktok-product-card-section-card :deep(.n-card__content) {
  min-height: 0;
  overflow: visible;
}

.tiktok-product-card-section-card :deep(.markdown-content) {
  max-height: none;
  overflow: visible;
}

.tiktok-product-card-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.tiktok-product-card-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
}

.tiktok-product-card-history-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

@media (max-width: 1000px) {
  .tiktok-product-card-grid {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .tiktok-product-card-result-scroll {
    min-height: 480px;
  }
}

@media (max-width: 640px) {
  .tiktok-product-card-workspace {
    padding: 10px;
  }

  .tiktok-product-card-model {
    align-items: stretch;
    flex-direction: column;
    min-width: 100%;
  }

  .tiktok-product-card-model :deep(.swc-select) {
    width: 100%;
  }

  .context-grid {
    grid-template-columns: 1fr;
  }

  .tiktok-product-card-result-actions {
    justify-content: flex-start;
  }
}
</style>
