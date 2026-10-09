<template>
  <section
    class="desktop-product-card"
    data-testid="desktop-product-card"
    @paste="paste"
  >
    <header>
      <h1>{{ t("tiktokProductCard.title") }}</h1>
      <NButton @click="router.push({ name: 'tiktok-product-card-history' })">{{
        t("tiktokProductCard.openHistory")
      }}</NButton>
    </header>
    <div class="columns">
      <NCard :title="t('tiktokProductCard.inputTitle')">
        <NAlert type="info">{{ t("tiktokProductCard.desktop.scope") }}</NAlert>
        <NForm label-placement="top">
          <NFormItem :label="t('tiktokProductCard.desktop.url')"
            ><NInput
              v-model:value="url"
              :disabled="busy"
              placeholder="https://detail.1688.com/offer/875760500354.html"
          /></NFormItem>
          <NSpace>
            <NButton :disabled="busy" @click="checkEnvironment">{{
              t("tiktokProductCard.desktop.check")
            }}</NButton>
            <NButton
              :loading="collecting"
              :disabled="generating || preparing"
              @click="collect"
              >{{ t("tiktokProductCard.desktop.collect") }}</NButton
            >
            <NButton v-if="collecting" @click="cancel">{{
              t("tiktokProductCard.desktop.cancel")
            }}</NButton>
          </NSpace>
          <NText>{{ status }}</NText>
          <NSelect
            v-if="browsers.length"
            v-model:value="browser"
            :options="browsers"
            :disabled="busy"
          />
          <NAlert v-if="error" type="error">{{ error }}</NAlert>
          <template v-if="snapshot">
            <NFormItem :label="t('tiktokProductCard.desktop.sku')"
              ><NSelect
                v-model:value="selectedSkuId"
                :options="
                  snapshot.skus.map((s) => ({ label: s.label, value: s.id }))
                "
                :disabled="busy"
            /></NFormItem>
            <NText>{{ snapshot.sourceUrl }}</NText>
            <NText
              >{{ t("tiktokProductCard.desktop.missing") }}:
              {{
                snapshot.missingFields
                  .map((field) => t("tiktokProductCard.desktop." + field))
                  .join(" / ")
              }}</NText
            >
            <details>
              <summary>{{ t("tiktokProductCard.desktop.evidence") }}</summary>
              <pre>{{ JSON.stringify(snapshot, null, 2) }}</pre>
            </details>
            <NAlert v-if="snapshot.conflicts.length" type="warning">{{
              snapshot.conflicts
                .map((c) => t("tiktokProductCard.desktop." + c))
                .join(" / ")
            }}</NAlert>
            <NAlert type="warning">{{
              t("tiktokProductCard.desktop.imageLimit")
            }}</NAlert>
            <div class="image-grid">
              <label v-for="image in selectableImages" :key="image.id">
                <img
                  :src="image.url"
                  :alt="image.id"
                  referrerpolicy="no-referrer"
                />
                <NButton
                  size="small"
                  :disabled="
                    busy ||
                    images.length >= 9 ||
                    images.some((i) => i.sourceId === image.id)
                  "
                  @click="importImage(image.id)"
                  >{{ t("tiktokProductCard.desktop.importImage") }}</NButton
                >
                <small>{{ image.quality }}</small>
              </label>
            </div>
          </template>
          <NFormItem :label="t('tiktokProductCard.model')"
            ><TextModelQuickSwitch
              :model-key="modelSelection.selectedOptimizeModelKey.value"
              :options="modelSelection.textModelOptions.value"
              :refresh-models="modelSelection.refreshTextModels"
              :disabled="busy"
          /></NFormItem>
          <NFormItem :label="t('tiktokProductCard.productTitle')"
            ><NInput v-model:value="title" :disabled="busy"
          /></NFormItem>
          <NFormItem :label="t('tiktokProductCard.specifications')"
            ><NInput v-model:value="details" type="textarea" :disabled="busy"
          /></NFormItem>
          <NFormItem :label="t('tiktokProductCard.supplierDescription')"
            ><NInput
              v-model:value="description"
              type="textarea"
              :disabled="busy"
          /></NFormItem>
          <NCheckbox
            v-if="snapshot"
            v-model:checked="confirmed"
            :disabled="busy"
            >{{ t("tiktokProductCard.desktop.confirm") }}</NCheckbox
          >
          <NFormItem :label="t('tiktokProductCard.desktop.brand')"
            ><NInput v-model:value="brandName" :disabled="busy" /><NCheckbox
              v-model:checked="brandAuthorized"
              :disabled="busy"
              >{{ t("tiktokProductCard.desktop.authorized") }}</NCheckbox
            ></NFormItem
          >
          <div>
            <NText>{{ t("tiktokProductCard.imageRequired") }}</NText>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              :disabled="busy"
              @change="upload"
            />
            <div class="image-grid">
              <div v-for="image in images" :key="image.id">
                <small>{{ image.name }} · {{ image.id }}</small>
                <img :src="image.preview" :alt="image.name" /><NButton
                  :disabled="busy"
                  @click="removeImage(image.id)"
                  >×</NButton
                >
              </div>
            </div>
          </div>
          <NFormItem :label="t('tiktokProductCard.desktop.duration')"
            ><NSelect
              v-model:value="duration"
              :options="
                VIDEO_DURATIONS.map((value) => ({ value, label: value + 's' }))
              "
              :disabled="busy"
          /></NFormItem>
          <NText>{{ t("tiktokProductCard.desktop.trimHint") }}</NText>
          <NSpace
            ><NButton :disabled="busy" @click="clear">{{
              t("tiktokProductCard.clear")
            }}</NButton>
            <NButton
              type="primary"
              :loading="generating"
              :disabled="collecting || preparing"
              @click="generate"
              >{{ t("tiktokProductCard.generate") }}</NButton
            ></NSpace
          >
        </NForm>
      </NCard>
      <NCard :title="t('tiktokProductCard.resultTitle')">
        <NSpace
          ><NButton :disabled="!result" @click="copy(markdown)">{{
            t("tiktokProductCard.copy")
          }}</NButton
          ><NButton :disabled="!result" @click="exportResult">{{
            t("tiktokProductCard.download")
          }}</NButton
          ><NButton :disabled="!result" @click="favorite">{{
            t("tiktokProductCard.saveFavorite")
          }}</NButton></NSpace
        >
        <NAlert type="info">{{
          t("tiktokProductCard.desktop.advisory")
        }}</NAlert>
        <NAlert v-if="report.risks.length" type="warning">
          <div v-for="(risk, i) in report.risks" :key="i">
            {{ risk.category }} / {{ risk.severity }}: {{ risk.match }} —
            {{ risk.reason }} — {{ risk.suggestion }}
          </div>
        </NAlert>
        <NEmpty
          v-if="!result"
          :description="t('tiktokProductCard.emptyResult')"
        />
        <template v-else>
          <NCard
            v-for="block in blocks"
            :key="block.key"
            :title="block.label"
            size="small"
          >
            <NButton @click="copy(block.text)">{{
              t("tiktokProductCard.desktop.copyBlock")
            }}</NButton>
            <NInput
              :value="block.text"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 12 }"
              @update:value="editBlock(block.key, $event)"
            />
          </NCard>
          <NCard :title="t('tiktokProductCard.desktop.video')" size="small">
            <NButton @click="copy(videoMarkdown)">{{
              t("tiktokProductCard.desktop.copyBlock")
            }}</NButton>
            <NCard
              v-for="(clip, i) in result.video.clips"
              :key="i"
              :title="
                'Clip ' + (i + 1) + ' · ' + clip.start + '–' + clip.end + 's'
              "
              size="small"
            >
              <p>{{ clip.scene }}</p>
              <p>{{ clip.sellingPoint }}</p>
              <p>{{ clip.referenceImageIds.join(", ") }}</p>
              <NFormItem :label="t('tiktokProductCard.desktop.caption')"
                ><NInput v-model:value="clip.caption"
              /></NFormItem>
              <NFormItem :label="t('tiktokProductCard.desktop.voiceover')"
                ><NInput v-model:value="clip.voiceover"
              /></NFormItem>
              <NInput
                v-model:value="clip.prompt"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 12 }"
              />
              <NButton @click="copy(clip.prompt)">{{
                t("tiktokProductCard.desktop.copyBlock")
              }}</NButton>
            </NCard>
            <p>{{ result.video.editingGuide }}</p>
          </NCard>
        </template>
      </NCard>
    </div>
  </section>
</template>
<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type Ref,
} from "vue";
import { useI18n } from "vue-i18n";
import {
  NAlert,
  NButton,
  NCard,
  NCheckbox,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NText,
} from "naive-ui";
import {
  VIDEO_DURATIONS,
  checkProductCompliance,
  parseEnhancedResult,
  enhancedResultSchema,
  type EnhancedProductCardResult,
  type ProductSnapshot,
  type VideoDuration,
  type ImageInputRef,
} from "@prompt-optimizer/core";
import type { AppServices } from "../../types/services";
import TextModelQuickSwitch from "../TextModelQuickSwitch.vue";
import { useWorkspaceModelSelection } from "../../composables/workspaces/useWorkspaceModelSelection";
import { useImageInputPreparation } from "../../composables/image/useImageInputPreparation";
import { fileToImageInputRef } from "../../utils/image-compression";
import { adaptDesktopProductImage } from "../../services/tiktok-product-card-desktop-images";
import { useClipboard } from "../../composables/ui/useClipboard";
import { useToast } from "../../composables/ui/useToast";
import { router } from "../../router";
import {
  DESKTOP_PRODUCT_CARD_SYSTEM_PROMPT,
  buildDesktopProductPrompt,
} from "../../services/tiktok-product-card-desktop-prompt";
import {
  loadTikTokProductCardHistory,
  TIKTOK_DESKTOP_HISTORY_KEY,
} from "../../utils/tiktok-product-card-history";
const { t } = useI18n();
const api = window.electronAPI!.productImport!;
const services = inject<Ref<AppServices | null>>("services", ref(null));
const modelSession = reactive({
  selectedOptimizeModelKey: "",
  selectedTestModelKey: "",
  updateOptimizeModel(value: string) {
    this.selectedOptimizeModelKey = value;
  },
  updateTestModel(value: string) {
    this.selectedTestModelKey = value;
  },
});
const modelSelection = useWorkspaceModelSelection(services, modelSession);
const { prepareFiles } = useImageInputPreparation();
const clipboard = useClipboard(),
  toast = useToast();
const url = ref(""),
  title = ref(""),
  details = ref(""),
  description = ref(""),
  brandName = ref(""),
  brandAuthorized = ref(false);
const duration = ref<VideoDuration>(10),
  snapshot = ref<ProductSnapshot>(),
  selectedSkuId = ref<string>(),
  confirmed = ref(false);
const collecting = ref(false),
  generating = ref(false),
  preparing = ref(false),
  busy = computed(
    () => collecting.value || generating.value || preparing.value,
  );
const error = ref(""),
  status = ref(""),
  browser = ref<string>(),
  browsers = ref<{ label: string; value: string }[]>([]);
const images = ref<
  {
    id: string;
    sourceId?: string;
    name: string;
    preview: string;
    input: ImageInputRef;
  }[]
>([]);
const result = ref<EnhancedProductCardResult>();
let taskId = "",
  active = true,
  restoring = false;
const selectableImages = computed(
  () =>
    snapshot.value?.images.filter(
      (i) =>
        i.quality !== "thumbnail" &&
        (!i.skuIds.length || i.skuIds.includes(selectedSkuId.value || "")),
    ) || [],
);
const blocks = computed(() =>
  result.value
    ? [
        {
          key: "title",
          label: t("tiktokProductCard.desktop.title"),
          text: result.value.title.text,
        },
        {
          key: "description",
          label: t("tiktokProductCard.desktop.description"),
          text: result.value.description.text,
        },
        {
          key: "image",
          label: t("tiktokProductCard.desktop.image"),
          text: result.value.mainImagePrompt.prompt,
        },
      ]
    : [],
);
const videoMarkdown = computed(
  () =>
    result.value?.video.clips
      .map(
        (c, i) =>
          "### Clip " +
          (i + 1) +
          " (" +
          c.start +
          "–" +
          c.end +
          "s)\n" +
          c.scene +
          "\n" +
          c.sellingPoint +
          "\nReferences: " +
          c.referenceImageIds.join(", ") +
          "\nCaption: " +
          c.caption +
          "\nVoiceover: " +
          c.voiceover +
          "\n" +
          c.prompt,
      )
      .join("\n\n") +
    "\n" +
    (result.value?.video.editingGuide || ""),
);
const markdown = computed(
  () =>
    blocks.value.map((b) => "## " + b.label + "\n" + b.text).join("\n\n") +
    "\n\n## " +
    t("tiktokProductCard.desktop.video") +
    "\n" +
    videoMarkdown.value,
);
const report = computed(() =>
  checkProductCompliance(
    result.value ? JSON.stringify(result.value) : "",
    brandName.value
      ? { name: brandName.value, authorized: brandAuthorized.value }
      : undefined,
  ),
);
watch([title, details, description, selectedSkuId], () => {
  confirmed.value = false;
});
watch(selectedSkuId, async () => {
  if (restoring) return;
  clearImages();
  result.value = undefined;
  if (!selectedSkuId.value) return;
  const sku = snapshot.value?.skus.find((s) => s.id === selectedSkuId.value);
  if (sku?.imageIds[0]) await importImage(sku.imageIds[0]);
});
function message(e: unknown) {
  const code = e instanceof Error ? e.message : String(e);
  return t("tiktokProductCard.desktop.failed", { error: code });
}
async function checkEnvironment() {
  try {
    const env = await api.checkEnvironment();
    browsers.value = env.browsers.map((b) => ({
      label: b.label || b.instance_id || "",
      value: b.instance_id || "",
    }));
    if (browsers.value.length === 1) browser.value = browsers.value[0].value;
    status.value = t("tiktokProductCard.desktop.connected");
    error.value = "";
  } catch (e) {
    error.value = message(e);
    status.value = t("tiktokProductCard.desktop.disconnected");
  }
}
async function collect() {
  if (busy.value) return;
  collecting.value = true;
  error.value = "";
  result.value = undefined;
  clearImages();
  snapshot.value = undefined;
  taskId = crypto.randomUUID();
  try {
    await checkEnvironment();
    if (!browser.value) throw new Error("SELECT_BROWSER");
    status.value = t("tiktokProductCard.desktop.collecting");
    const data = await api.collectProduct(url.value, {
      taskId,
      browser: browser.value,
    });
    if (!active) return;
    snapshot.value = data;
    selectedSkuId.value = undefined;
    title.value = data.title;
    details.value = data.attributes
      .map((a) => a.name + ": " + a.value)
      .join("\n");
    description.value = data.conflicts.includes("DESCRIPTION_PRODUCT_MISMATCH")
      ? ""
      : data.description;
    brandName.value =
      data.attributes.find((a) => a.name === "\u54c1\u724c")?.value || "";
    brandAuthorized.value = false;
    confirmed.value = false;
    status.value = t("tiktokProductCard.desktop.collected");
  } catch (e) {
    if (active) error.value = message(e);
  } finally {
    collecting.value = false;
  }
}
async function cancel() {
  await api.cancelCollect(taskId);
}
function clearImages() {
  images.value.forEach((i) => URL.revokeObjectURL(i.preview));
  images.value = [];
}
function removeImage(id: string) {
  const i = images.value.find((i) => i.id === id);
  if (i) URL.revokeObjectURL(i.preview);
  images.value = images.value.filter((i) => i.id !== id);
}
async function addFiles(files: File[], sourceId?: string) {
  if (files.length > 9 - images.value.length)
    toast.warning(t("tiktokProductCard.tooManyImages"));
  const compatible = await Promise.all(
    files.slice(0, 9 - images.value.length).map(adaptDesktopProductImage),
  );
  const prepared = await prepareFiles(compatible);
  if (!prepared || !active) return;
  for (const p of prepared) {
    const input = await fileToImageInputRef(p.file);
    if (!active) return;
    images.value.push({
      id: crypto.randomUUID(),
      sourceId,
      name: p.file.name,
      preview: URL.createObjectURL(p.file),
      input,
    });
  }
}
async function upload(e: Event) {
  const input = e.target as HTMLInputElement;
  preparing.value = true;
  try {
    await addFiles(Array.from(input.files || []));
  } catch (e) {
    error.value = message(e);
  } finally {
    input.value = "";
    preparing.value = false;
  }
}
async function paste(e: ClipboardEvent) {
  if (busy.value) return;
  const files = Array.from(e.clipboardData?.files || []).filter((f) =>
    f.type.startsWith("image/"),
  );
  if (!files.length) return;
  e.preventDefault();
  preparing.value = true;
  try {
    await addFiles(files);
  } catch (e) {
    error.value = message(e);
  } finally {
    preparing.value = false;
  }
}
async function importImage(id: string) {
  const image = selectableImages.value.find((i) => i.id === id);
  if (!image || busy.value || images.value.length >= 9) return;
  preparing.value = true;
  try {
    const r = await api.fetchImage(image.url);
    const bytes = Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));
    await addFiles(
      [new File([bytes], id + "." + r.mime.split("/")[1], { type: r.mime })],
      id,
    );
  } catch (e) {
    error.value = message(e);
  } finally {
    preparing.value = false;
  }
}
async function generate() {
  if (busy.value) return;
  if (!images.value.length) {
    toast.warning(t("tiktokProductCard.imageRequiredError"));
    return;
  }
  if (snapshot.value && (!selectedSkuId.value || !confirmed.value)) {
    toast.warning(t("tiktokProductCard.desktop.confirm"));
    return;
  }
  const promptService = services.value?.promptService,
    model = modelSelection.selectedOptimizeModelKey.value;
  if (!promptService || !model) {
    toast.warning(t("tiktokProductCard.modelRequiredError"));
    return;
  }
  generating.value = true;
  error.value = "";
  result.value = undefined;
  const ids = images.value.map((i) => i.id),
    requestedDuration = duration.value;
  try {
    const input = {
      duration: requestedDuration,
      title: title.value,
      details: details.value,
      description: description.value,
      imageIds: ids,
      snapshot: snapshot.value,
      selectedSkuId: selectedSkuId.value,
    };
    // Preflight flags brand authorization; raw supplier text is NOT treated as consumer copy.
    const preflight = checkProductCompliance(
      "",
      brandName.value
        ? { name: brandName.value, authorized: brandAuthorized.value }
        : undefined,
    );
    if (preflight.risks.length)
      toast.warning(t("tiktokProductCard.desktop.brandReview"));
    const raw = await promptService.testPrompt(
      DESKTOP_PRODUCT_CARD_SYSTEM_PROMPT,
      buildDesktopProductPrompt(input),
      model,
      images.value.map((i) => i.input),
    );
    let parsed: EnhancedProductCardResult;
    try {
      parsed = parseEnhancedResult(raw, requestedDuration, ids);
    } catch (e) {
      if (!(e instanceof Error) || e.message !== "VIDEO_TIMELINE_INVALID")
        throw e;
      const original = enhancedResultSchema.parse(
        JSON.parse(
          raw
            .trim()
            .replace(/^\x60\x60\x60(?:json)?\s*/i, "")
            .replace(/\s*\x60\x60\x60$/, ""),
        ),
      );
      const repaired = await promptService.testPrompt(
        DESKTOP_PRODUCT_CARD_SYSTEM_PROMPT,
        buildDesktopProductPrompt(input) +
          "\nRepair only the VIDEO module: clip count, continuous timeline and exact durations must match. Keep the first three modules unchanged. Previous output: " +
          JSON.stringify(original),
        model,
        images.value.map((i) => i.input),
      );
      const replacement = parseEnhancedResult(repaired, requestedDuration, ids);
      parsed = parseEnhancedResult(
        JSON.stringify({ ...original, video: replacement.video }),
        requestedDuration,
        ids,
      );
    }
    if (!active) return;
    result.value = parsed;
    const entry = {
      id: crypto.randomUUID(),
      title: title.value || parsed.title.text,
      createdAt: Date.now(),
      content: markdown.value,
      modelKey: model,
      productTitle: title.value,
      specifications: details.value,
      supplierDescription: description.value,
      imageNames: images.value.map((i) => i.name),
      desktop: {
        version: 2,
        snapshot: snapshot.value,
        selectedSkuId: selectedSkuId.value,
        duration: requestedDuration,
        result: parsed,
        compliance: report.value,
        brandName: brandName.value,
        brandAuthorized: brandAuthorized.value,
      },
    };
    const pref = services.value?.preferenceService;
    if (pref) {
      const old = await pref.get<unknown>(TIKTOK_DESKTOP_HISTORY_KEY, []);
      await pref.set(
        TIKTOK_DESKTOP_HISTORY_KEY,
        [entry, ...(Array.isArray(old) ? old : [])].slice(0, 20),
      );
    }
  } catch (e) {
    error.value = message(e);
  } finally {
    generating.value = false;
  }
}
function editBlock(key: string, value: string) {
  if (!result.value) return;
  if (key === "title") result.value.title.text = value;
  else if (key === "description") result.value.description.text = value;
  else result.value.mainImagePrompt.prompt = value;
}
async function copy(text: string) {
  try {
    await clipboard.copyText(text);
    toast.success(t("tiktokProductCard.copySuccess"));
  } catch {
    toast.error(t("tiktokProductCard.copyFailed"));
  }
}
function exportResult() {
  if (!result.value) return;
  const content =
    markdown.value +
    "\n\n" +
    t("tiktokProductCard.desktop.advisory") +
    "\n" +
    JSON.stringify(report.value, null, 2);
  const u = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = u;
  a.download = "tiktok-product-card.md";
  a.click();
  URL.revokeObjectURL(u);
}
async function favorite() {
  if (!result.value) return;
  try {
    await services.value?.favoriteManager.addFavorite({
      title: title.value || result.value.title.text,
      content: markdown.value,
      description: t("tiktokProductCard.desktop.advisory"),
      tags: ["TikTok Shop", "Singapore", "Pet Supplies"],
      functionMode: "basic",
      optimizationMode: "system",
      metadata: { desktopProductCard: true, compliance: report.value },
    });
    toast.success(t("tiktokProductCard.favoriteSuccess"));
  } catch (e) {
    error.value = message(e);
  }
}
function clear() {
  clearImages();
  snapshot.value = undefined;
  selectedSkuId.value = undefined;
  result.value = undefined;
  title.value = "";
  details.value = "";
  description.value = "";
  confirmed.value = false;
  duration.value = 10;
  brandName.value = "";
  brandAuthorized.value = false;
  error.value = "";
}
onMounted(async () => {
  await checkEnvironment();
  try {
    const id = router.currentRoute.value.query.history;
    const entries = await loadTikTokProductCardHistory(
      services.value?.preferenceService,
    );
    const entry = entries.find((e) => e.id === id);
    if (entry?.desktop) {
      restoring = true;
      title.value = entry.productTitle;
      details.value = entry.specifications;
      description.value = entry.supplierDescription;
      duration.value = entry.desktop.duration;
      selectedSkuId.value = entry.desktop.selectedSkuId;
      snapshot.value = entry.desktop.snapshot;
      result.value = entry.desktop.result;
      brandName.value = entry.desktop.brandName || "";
      brandAuthorized.value = entry.desktop.brandAuthorized || false;
      modelSession.updateOptimizeModel(entry.modelKey);
      await nextTick();
      restoring = false;
    }
  } catch (e) {
    error.value = message(e);
    restoring = false;
  }
});
onBeforeUnmount(() => {
  active = false;
  clearImages();
  if (collecting.value) void cancel().catch(() => {});
});
</script>
<style scoped>
.desktop-product-card {
  padding: 16px;
  overflow: auto;
  width: 100%;
  height: 100%;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.columns {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(300px, 1.5fr);
  gap: 16px;
  align-items: start;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
}
.image-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.n-card,
.n-alert {
  margin-bottom: 12px;
}
@media (max-width: 900px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
