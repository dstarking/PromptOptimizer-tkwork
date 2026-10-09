import { describe, it, expect, vi } from "vitest";
import { adaptDesktopProductImage } from "../../../src/services/tiktok-product-card-desktop-images";
import {
  buildDesktopProductPrompt,
  DESKTOP_PRODUCT_CARD_SYSTEM_PROMPT,
} from "../../../src/services/tiktok-product-card-desktop-prompt";
import { TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT } from "../../../src/services/tiktok-product-card-prompt";
import {
  loadTikTokProductCardHistory,
  TIKTOK_DESKTOP_HISTORY_KEY,
  TIKTOK_PRODUCT_CARD_HISTORY_KEY,
} from "../../../src/utils/tiktok-product-card-history";
describe("desktop prompts and backward compatibility", () => {
  it("converts CDN WebP losslessly to PNG while leaving existing JPEG/PNG input untouched", async () => {
    const close = vi.fn(),
      drawImage = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 800, height: 600, close }),
    );
    const context = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage } as never);
    const encode = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback, mime) =>
        callback(new Blob(["png"], { type: mime })),
      );
    try {
      const jpeg = new File(["jpg"], "original.jpg", { type: "image/jpeg" });
      expect(await adaptDesktopProductImage(jpeg)).toBe(jpeg);
      const converted = await adaptDesktopProductImage(
        new File(["webp"], "cdn.webp", { type: "image/webp" }),
      );
      expect(converted.type).toBe("image/png");
      expect(converted.name).toBe("cdn.png");
      expect(encode.mock.calls[0][1]).toBe("image/png");
      expect(drawImage).toHaveBeenCalledOnce();
      expect(close).toHaveBeenCalledOnce();
    } finally {
      context.mockRestore();
      encode.mockRestore();
      vi.unstubAllGlobals();
    }
  });
  it("bounds WebP conversion dimensions and releases decoded bitmap on failure", async () => {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 10000, height: 10000, close }),
    );
    try {
      await expect(
        adaptDesktopProductImage(
          new File(["webp"], "cdn.webp", { type: "image/webp" }),
        ),
      ).rejects.toThrow("conversion limit");
      expect(close).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it.each([10, 15, 20, 25, 30] as const)(
    "transmits exact requested timeline %s",
    (duration) => {
      const p = JSON.parse(
        buildDesktopProductPrompt({
          duration,
          title: "Lint roller",
          details: "",
          description: "",
          imageIds: ["actual-image"],
        }),
      );
      expect(p.totalDuration).toBe(duration);
      expect(
        p.timeline.reduce(
          (sum: number, c: { duration: number }) => sum + c.duration,
          0,
        ),
      ).toBe(duration);
      expect(p.references).toEqual(["actual-image"]);
      expect(p.timeline[p.timeline.length - 1].end).toBe(duration);
    },
  );
  it("does not overwrite the Web three-module prompt or claim verified real-time keywords", () => {
    expect(TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT).toContain(
      "only three final assets",
    );
    expect(TIKTOK_PRODUCT_CARD_SYSTEM_PROMPT).not.toContain("video {");
    expect(DESKTOP_PRODUCT_CARD_SYSTEM_PROMPT).toContain("NOT verified live");
  });
  it("does not expose internal SKU purchasing prices in consumer prompt", () => {
    const p = buildDesktopProductPrompt({
      duration: 10,
      title: "Toy",
      details: "",
      description: "",
      imageIds: ["ref"],
    });
    expect(p).toContain("Source prices and stock are internal data");
  });
  it("Web history loads only v1 records and never accesses desktop history", async () => {
    delete window.electronAPI;
    const calls: string[] = [];
    const entry = {
      id: "old",
      title: "Old",
      createdAt: 1,
      content: "Old content",
      modelKey: "m",
      productTitle: "Old",
      specifications: "",
      supplierDescription: "",
      imageNames: [],
    };
    const pref = {
      get: async (key: string) => {
        calls.push(key);
        return [entry];
      },
    };
    expect(await loadTikTokProductCardHistory(pref as never)).toEqual([entry]);
    expect(calls).toEqual([TIKTOK_PRODUCT_CARD_HISTORY_KEY]);
    expect(calls).not.toContain(TIKTOK_DESKTOP_HISTORY_KEY);
  });
});
