<template>
  <section class="tiktok-product-card-history-page" data-testid="tiktok-product-card-history-page">
    <header class="tiktok-product-card-history-page-header">
      <div>
        <NText tag="h1" class="tiktok-product-card-history-page-title">
          {{ t('tiktokProductCard.historyTitle') }}
        </NText>
        <NText depth="3">{{ t('tiktokProductCard.historyPageDescription') }}</NText>
      </div>
      <NButton secondary data-testid="tiktok-product-card-history-return" @click="returnToProductCard">
        <template #icon>
          <NIcon><ArrowBackUp /></NIcon>
        </template>
        {{ t('tiktokProductCard.returnToProductCard') }}
      </NButton>
    </header>

    <NCard class="tiktok-product-card-history-page-card">
      <NText depth="3" class="tiktok-product-card-history-page-hint">
        {{ t('tiktokProductCard.historyImagesNotSaved') }}
      </NText>

      <NSpin :show="isLoading">
        <NEmpty v-if="!isLoading && historyEntries.length === 0" :description="t('tiktokProductCard.historyEmpty')" />
        <div v-else-if="!isLoading" class="tiktok-product-card-history-page-list">
          <div
            v-for="entry in historyEntries"
            :key="entry.id"
            class="tiktok-product-card-history-page-item"
          >
            <div class="tiktok-product-card-history-page-copy">
              <NText strong>{{ entry.title }}</NText>
              <NText depth="3">
                {{ t('tiktokProductCard.generatedAt', { time: formatHistoryTime(entry.createdAt) }) }}
              </NText>
              <NText depth="3">
                {{ t('tiktokProductCard.historyImageNames', { count: entry.imageNames.length }) }}
              </NText>
            </div>
            <NButton size="small" tertiary @click="loadHistoryEntry(entry)">
              {{ t('tiktokProductCard.loadHistory') }}
            </NButton>
          </div>
        </div>
      </NSpin>
    </NCard>
  </section>
</template>

<script setup lang="ts">
import { inject, onMounted, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NCard, NEmpty, NIcon, NSpin, NText } from 'naive-ui'
import { ArrowBackUp } from '@vicons/tabler'

import { router as routerInstance } from '../../router'
import type { AppServices } from '../../types/services'
import {
  loadTikTokProductCardHistory,
  type TikTokProductCardHistoryEntry,
} from '../../utils/tiktok-product-card-history'

const { t, locale } = useI18n() as unknown as {
  t: (key: string, params?: Record<string, unknown>) => string
  locale: Ref<string>
}
const services = inject<Ref<AppServices | null>>('services', ref<AppServices | null>(null))
const historyEntries = ref<TikTokProductCardHistoryEntry[]>([])
const isLoading = ref(true)

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

const returnToProductCard = () => {
  void routerInstance.push({ name: 'tiktok-product-card' })
}

const loadHistoryEntry = (entry: TikTokProductCardHistoryEntry) => {
  void routerInstance.push({
    name: 'tiktok-product-card',
    query: { history: entry.id },
  })
}

onMounted(async () => {
  try {
    historyEntries.value = await loadTikTokProductCardHistory(services.value?.preferenceService)
  } catch (error) {
    console.warn('[TikTokProductCardHistoryPage] Failed to load history:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.tiktok-product-card-history-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: auto;
}

.tiktok-product-card-history-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tiktok-product-card-history-page-title {
  display: block;
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 650;
}

.tiktok-product-card-history-page-card {
  flex: 1;
  min-height: 0;
}

.tiktok-product-card-history-page-hint {
  display: block;
  font-size: 12px;
  line-height: 1.45;
}

.tiktok-product-card-history-page-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.tiktok-product-card-history-page-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
}

.tiktok-product-card-history-page-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

@media (max-width: 640px) {
  .tiktok-product-card-history-page {
    padding: 10px;
  }

  .tiktok-product-card-history-page-item {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
