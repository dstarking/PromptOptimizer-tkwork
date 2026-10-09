import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shallowMount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";
import {
  normalizeProductPages,
  type EnhancedProductCardResult,
  type ProductSnapshot,
  type VideoDuration,
} from "@prompt-optimizer/core";
import Desktop from "../../../src/components/tiktok-mode/TikTokProductCardDesktop.vue";
import SelectWithConfig from "../../../src/components/SelectWithConfig.vue";
import { TIKTOK_DESKTOP_HISTORY_KEY } from "../../../src/utils/tiktok-product-card-history";
import fixtures from "../../../../desktop/services/browserskill/p0-variants.fixture.json";

const mocks = vi.hoisted(() => ({
  warning: vi.fn(),
  history: undefined as string | undefined,
}));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock("../../../src/router", () => ({
  router: {
    currentRoute: {
      value: {
        query: {
          get history() {
            return mocks.history;
          },
        },
      },
    },
    push: vi.fn(),
  },
}));
vi.mock("../../../src/composables/ui/useToast", () => ({
  useToast: () => ({
    warning: mocks.warning,
    success: vi.fn(),
    error: vi.fn(),
  }),
}));
vi.mock("../../../src/composables/ui/useClipboard", () => ({
  useClipboard: () => ({ copyText: vi.fn() }),
}));
vi.mock("../../../src/composables/image/useImageInputPreparation", () => ({
  useImageInputPreparation: () => ({
    prepareFiles: async (files: File[]) => files.map((file) => ({ file })),
  }),
}));
vi.mock("../../../src/services/tiktok-product-card-desktop-images", () => ({
  adaptDesktopProductImage: async (file: File) => file,
}));

type State = {
  duration: VideoDuration;
  snapshot?: ProductSnapshot;
  selectedSkuId?: string;
  confirmed: boolean;
  preparing: boolean;
  result?: EnhancedProductCardResult;
  brandName: string;
  brandAuthorized: boolean;
  images: {
    id: string;
    sourceId?: string;
    name: string;
    preview: string;
    input: { b64: string; mimeType: string };
  }[];
  generate: () => Promise<void>;
  clear: () => void;
  collect: () => Promise<void>;
  importImage: (id: string) => Promise<void>;
};
const wrappers: ReturnType<typeof shallowMount>[] = [];
function output(duration: VideoDuration = 15) {
  return {
    title: {
      text: "Pet Hair Lint Roller",
      seoKeywords: ["lint roller"],
      emotionalAngle: "Daily cleanup",
    },
    description: {
      text: "Keep your favourite clothes free of loose pet hair.",
    },
    mainImagePrompt: {
      prompt:
        "Use the uploaded original product images as the exact visual reference. 1:1.",
      referenceImageIds: ["ref"],
    },
    video: {
      totalDuration: duration,
      clips: [
        {
          start: 0,
          end: 10,
          duration: 10,
          scene: "Before work",
          sellingPoint: "Picks up loose hair",
          caption: "Quick cleanup",
          voiceover: "Ready for your day",
          prompt: "10 seconds, 9:16. Preserve the uploaded product.",
          referenceImageIds: ["ref"],
        },
        ...(duration === 15
          ? [
              {
                start: 10,
                end: 15,
                duration: 5,
                scene: "Clean clothes",
                sellingPoint: "Easy daily use",
                caption: "See product details",
                voiceover: "Make cleanup part of your routine",
                prompt: "5 seconds, 9:16. Preserve the uploaded product.",
                referenceImageIds: ["ref"],
              },
            ]
          : []),
      ],
      editingGuide: "Keep product identity consistent.",
    },
  };
}
async function setup(
  responses = [JSON.stringify(output())],
  history: unknown[] = [],
  seedImages = true,
) {
  const testPrompt = vi.fn();
  const openModelManager = vi.fn();
  const getEnabledModels = vi.fn().mockResolvedValue([
    {
      id: "model",
      name: "Multimodal",
      enabled: true,
      providerMeta: { id: "anthropic", name: "Anthropic" },
      modelMeta: { id: "claude", name: "Claude" },
      connectionConfig: {},
    },
    {
      id: "model-2",
      name: "Xunfei",
      enabled: true,
      providerMeta: { id: "custom", name: "OpenAI compatible" },
      modelMeta: { id: "astro-code-latest", name: "astro-code-latest" },
      connectionConfig: {},
    },
  ]);
  responses.forEach((raw) => testPrompt.mockResolvedValueOnce(raw));
  const set = vi.fn(),
    get = vi
      .fn()
      .mockImplementation(async (key: string) =>
        key === TIKTOK_DESKTOP_HISTORY_KEY ? history : [],
      );
  window.electronAPI = {
    productImport: {
      capability: "windows-product-card-v1",
      checkEnvironment: vi
        .fn()
        .mockResolvedValue({ browsers: [{ instance_id: "browser" }] }),
      cancelCollect: vi.fn(),
      collectProduct: vi
        .fn()
        .mockResolvedValue(normalizeProductPages(fixtures as never)),
      fetchImage: vi.fn().mockRejectedValue(new Error("IMAGE_DOWNLOAD_FAILED")),
    },
  } as never;
  const wrapper = shallowMount(Desktop, {
    global: {
      provide: {
        services: ref({
          modelManager: { getEnabledModels },
          promptService: { testPrompt },
          preferenceService: { get, set },
        }),
        openModelManager,
      },
      renderStubDefaultSlot: true,
      stubs: { TextModelQuickSwitch: true },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  const state = wrapper.vm as unknown as State;
  if (seedImages) {
    state.images = [
      {
        id: "ref",
        name: "original.png",
        preview: "blob:test",
        input: { b64: "a", mimeType: "image/png" },
      },
    ];
    state.duration = 15;
  }
  return {
    wrapper,
    state,
    testPrompt,
    set,
    openModelManager,
    getEnabledModels,
  };
}
beforeEach(() => {
  mocks.warning.mockClear();
  mocks.history = undefined;
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      revokeObjectURL: vi.fn(),
      createObjectURL: vi.fn(() => "blob:test"),
    }),
  );
});
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount());
  delete window.electronAPI;
  vi.unstubAllGlobals();
});
describe("Windows desktop product-card interactions", () => {
  it("automatically imports public images after collecting and passes their bytes to generation", async () => {
    const { state, wrapper, testPrompt } = await setup([], [], false);
    const fetchImage = vi.mocked(window.electronAPI!.productImport!.fetchImage);
    fetchImage.mockResolvedValue({ mime: "image/png", data: "aGVsbG8=" });
    await state.collect();
    const publicImages = state.snapshot!.images.filter(
      (i) => !i.skuIds.length && i.quality !== "thumbnail",
    );
    expect(state.images.map((i) => i.sourceId)).toEqual(
      publicImages.slice(0, 9).map((i) => i.id),
    );
    expect(state.images[0].input).toMatchObject({
      b64: "aGVsbG8=",
      mimeType: "image/png",
    });
    expect(wrapper.find('[data-testid="product-images-ready"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="product-images-manual"]').exists()).toBe(
      false,
    );
    state.selectedSkuId = state.snapshot!.skus[0].id;
    await flushPromises();
    await vi.waitFor(() => expect(state.preparing).toBe(false));
    state.confirmed = true;
    await state.generate();
    expect(testPrompt.mock.calls[0][3]).toEqual(
      state.images.map((i) => i.input),
    );
  });
  it("keeps usable images when another download fails and avoids duplicate imports", async () => {
    const { state } = await setup([], [], false);
    const fetchImage = vi.mocked(window.electronAPI!.productImport!.fetchImage);
    fetchImage
      .mockRejectedValueOnce(new Error("IMAGE_DOWNLOAD_FAILED"))
      .mockResolvedValue({ mime: "image/png", data: "aGVsbG8=" });
    await state.collect();
    expect(state.images.length).toBeGreaterThan(0);
    const before = state.images.length;
    await state.importImage(state.images[0].sourceId!);
    expect(state.images).toHaveLength(before);
  });
  it("falls back to manual upload for failed downloads or thumbnail-only snapshots", async () => {
    const { state, wrapper } = await setup([], [], false);
    await state.collect();
    expect(state.images).toEqual([]);
    expect(wrapper.find('[data-testid="product-images-manual"]').exists()).toBe(
      true,
    );
    const snapshot = normalizeProductPages(fixtures as never);
    snapshot.images.forEach((i) => {
      i.quality = "thumbnail";
    });
    vi.mocked(
      window.electronAPI!.productImport!.collectProduct,
    ).mockResolvedValue(snapshot);
    const fetchImage = vi.mocked(window.electronAPI!.productImport!.fetchImage);
    fetchImage.mockClear();
    await state.collect();
    expect(fetchImage).not.toHaveBeenCalled();
    expect(state.images).toEqual([]);
  });
  it("prioritizes the selected SKU and excludes other SKU references on each switch", async () => {
    const { state } = await setup([], [], false);
    vi.mocked(window.electronAPI!.productImport!.fetchImage).mockResolvedValue({
      mime: "image/png",
      data: "aGVsbG8=",
    });
    await state.collect();
    const snapshot = state.snapshot!;
    for (const sku of [
      snapshot.skus[0],
      snapshot.skus.find(
        (s) => s.imageIds[0] !== snapshot.skus[0].imageIds[0],
      )!,
    ]) {
      state.selectedSkuId = sku.id;
      await flushPromises();
      await vi.waitFor(() => expect(state.preparing).toBe(false));
      expect(state.images[0].sourceId).toBe(sku.imageIds[0]);
      expect(
        state.images.every((i) => {
          const source = snapshot.images.find((s) => s.id === i.sourceId)!;
          return !source.skuIds.length || source.skuIds.includes(sku.id);
        }),
      ).toBe(true);
    }
  });
  it("replaces collected images on retry and ignores a stale download after clearing", async () => {
    const { state } = await setup([], [], false);
    const fetchImage = vi.mocked(window.electronAPI!.productImport!.fetchImage);
    fetchImage.mockResolvedValue({ mime: "image/png", data: "aGVsbG8=" });
    await state.collect();
    const count = state.images.length;
    await state.collect();
    expect(state.images).toHaveLength(count);
    let release!: (value: { mime: string; data: string }) => void;
    fetchImage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const pending = state.collect();
    await flushPromises();
    state.clear();
    release({ mime: "image/png", data: "aGVsbG8=" });
    await pending;
    expect(state.images).toEqual([]);
  });
  it("lists both enabled configurations and generates with the selected configuration, not just its internal model", async () => {
    const { wrapper, state, testPrompt, set } = await setup();
    const selector = wrapper.findComponent(SelectWithConfig);
    expect(selector.props("options").map((o) => o.value)).toEqual([
      "model",
      "model-2",
    ]);
    selector.vm.$emit("update:modelValue", "model-2");
    await flushPromises();
    expect(selector.props("modelValue")).toBe("model-2");
    await state.generate();
    expect(testPrompt.mock.calls[0][2]).toBe("model-2");
    expect(set.mock.calls[0][1][0].modelKey).toBe("model-2");
  });
  it("refreshes configurations on focus and opens the existing text model manager", async () => {
    const { wrapper, openModelManager, getEnabledModels } = await setup();
    const selector = wrapper.findComponent(SelectWithConfig);
    const before = getEnabledModels.mock.calls.length;
    selector.vm.$emit("focus");
    await flushPromises();
    expect(getEnabledModels.mock.calls.length).toBeGreaterThan(before);
    selector.vm.$emit("config");
    expect(openModelManager).toHaveBeenCalledWith("text");
    expect(selector.props("showConfigAction")).toBe(true);
  });
  it("uses the visible duration and saves four modules only to desktop v2 history", async () => {
    const { state, testPrompt, set } = await setup();
    await state.generate();
    expect(JSON.parse(testPrompt.mock.calls[0][1]).totalDuration).toBe(15);
    expect(state.result?.video.clips.map((c) => c.duration)).toEqual([10, 5]);
    expect(set.mock.calls[0][0]).toBe(TIKTOK_DESKTOP_HISTORY_KEY);
    expect(set.mock.calls[0][1][0].desktop.duration).toBe(15);
    expect(set.mock.calls[0][1][0].desktop.result.title.text).toBe(
      "Pet Hair Lint Roller",
    );
  });
  it("requires selected SKU and explicit fact confirmation before generating", async () => {
    const { state, testPrompt } = await setup();
    state.snapshot = normalizeProductPages(fixtures as never);
    await state.generate();
    expect(testPrompt).not.toHaveBeenCalled();
    state.selectedSkuId = state.snapshot.skus[0].id;
    await flushPromises();
    state.images = [
      {
        id: "ref",
        name: "original.png",
        preview: "blob:test",
        input: { b64: "a", mimeType: "image/png" },
      },
    ];
    await state.generate();
    expect(testPrompt).not.toHaveBeenCalled();
    state.confirmed = true;
    await state.generate();
    expect(testPrompt).toHaveBeenCalledOnce();
  });
  it("repairs only video once and preserves original title, description and image prompt", async () => {
    const broken = output(),
      repaired = output();
    broken.video.clips[0].end = 9;
    repaired.title.text = "Unwanted rewritten title";
    const { state, testPrompt } = await setup([
      JSON.stringify(broken),
      JSON.stringify(repaired),
    ]);
    await state.generate();
    expect(testPrompt).toHaveBeenCalledTimes(2);
    expect(state.result?.title).toEqual(broken.title);
    expect(state.result?.description).toEqual(broken.description);
    expect(state.result?.mainImagePrompt).toEqual(broken.mainImagePrompt);
    expect(state.result?.video.clips[0].end).toBe(10);
  });
  it("clears stale brand authorization with the current input", async () => {
    const { state } = await setup();
    state.brandName = "Old brand";
    state.brandAuthorized = true;
    state.clear();
    expect(state.brandName).toBe("");
    expect(state.brandAuthorized).toBe(false);
    expect(state.duration).toBe(10);
    expect(state.images).toEqual([]);
  });
  it("restores duration, selected SKU and video without the SKU watcher erasing the result", async () => {
    mocks.history = "saved";
    const snapshot = normalizeProductPages(fixtures as never);
    const entry = {
      id: "saved",
      title: "Saved",
      createdAt: 1,
      content: "Saved plan",
      modelKey: "model",
      productTitle: "Lint roller",
      specifications: "Confirmed",
      supplierDescription: "",
      imageNames: ["original.png"],
      desktop: {
        version: 2,
        snapshot,
        selectedSkuId: snapshot.skus[0].id,
        duration: 15,
        result: output(),
        compliance: { risks: [], publishable: true, advisory: true },
      },
    };
    const { state } = await setup([], [entry], false);
    expect(state.duration).toBe(15);
    expect(state.selectedSkuId).toBe(snapshot.skus[0].id);
    expect(state.result?.video.clips).toHaveLength(2);
    expect(state.result?.title.text).toBe("Pet Hair Lint Roller");
    expect(state.images).toEqual([]);
  });
});
