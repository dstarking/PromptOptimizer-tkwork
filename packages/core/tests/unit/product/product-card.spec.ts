import { describe, it, expect } from "vitest";
import {
  splitVideoDuration,
  parseEnhancedResult,
} from "../../../src/services/product-import/video";
import {
  normalizeProductPages,
  validate1688Url,
} from "../../../src/services/product-import/normalize";
import { checkProductCompliance } from "../../../src/services/product-compliance";
import fixtures from "../../../../desktop/services/browserskill/p0-variants.fixture.json";
describe("product import and video contracts", () => {
  it.each([
    [10, [10]],
    [15, [10, 5]],
    [20, [10, 10]],
    [25, [10, 10, 5]],
    [30, [10, 10, 10]],
  ] as const)("splits %s exactly", (duration, parts) =>
    expect(splitVideoDuration(duration)).toEqual(parts),
  );
  it("rejects unsupported duration", () =>
    expect(() => splitVideoDuration(12 as never)).toThrow());
  it.each([
    "file:///a",
    "https://evil.test/offer/123456.html",
    "https://detail.1688.com.evil/offer/123456.html",
    "https://u:p@detail.1688.com/offer/123456.html",
  ])("rejects unsafe URL %s", (u) =>
    expect(() => validate1688Url(u)).toThrow(),
  );
  it("normalizes real P0 combination evidence, not inferred cartesian products", () => {
    const p = normalizeProductPages(fixtures as never);
    expect(p.skus).toHaveLength(12);
    expect(p.images).toHaveLength(11);
    expect(
      p.skus.find(
        (s) => s.label.includes("16cm樱花粉") && s.label.includes("1卷纸"),
      )?.price,
    ).toBe(11);
    expect(
      p.skus.find(
        (s) => s.label.includes("24cm樱花粉") && s.label.includes("3卷纸"),
      )?.stock,
    ).toBe(9979);
    expect(p.conflicts).toContain("PACKAGING_PLACEHOLDER");
    expect(p.conflicts).toContain("DESCRIPTION_PRODUCT_MISMATCH");
    expect(p.skus.every((s) => s.imageIds.length === 1)).toBe(true);
    expect(p.images.some((i) => i.quality === "original")).toBe(false);
  });
  it("does not invent missing fields or accept changed product identities", () => {
    expect(() => normalizeProductPages([])).toThrow();
    expect(() => normalizeProductPages([fixtures[0]] as never)).toThrow("SKU_RELATION_INCOMPLETE");
    expect(() =>
      normalizeProductPages([
        { ...fixtures[0], url: "https://detail.1688.com/offer/999999.html" },
        fixtures[1],
      ] as never),
    ).toThrow("PRODUCT_ID_CHANGED");
  });
  it.each([10, 15, 20, 25, 30] as const)(
    "validates continuous timeline and references for %s",
    (duration) => {
      let start = 0;
      const result = {
        title: {
          text: "Pet Hair Lint Roller",
          seoKeywords: ["lint roller"],
          emotionalAngle: "Daily cleanup",
        },
        description: { text: "Clean loose hair from clothing." },
        mainImagePrompt: {
          prompt: "Use exact reference. 1:1.",
          referenceImageIds: ["ref-1"],
        },
        video: {
          totalDuration: duration,
          clips: splitVideoDuration(duration).map((d) => {
            const c = {
              start,
              end: start + d,
              duration: d,
              scene: "Clothing cleanup",
              sellingPoint: "Picks up hair",
              caption: "Daily cleanup",
              voiceover: "Keep your clothes fresh",
              prompt:
                d +
                " seconds, 9:16, uploaded product main image as exact reference.",
              referenceImageIds: ["ref-1"],
            };
            start += d;
            return c;
          }),
          editingGuide: "Keep appearance consistent.",
        },
      };
      expect(
        parseEnhancedResult(JSON.stringify(result), duration, ["ref-1"]).video
          .totalDuration,
      ).toBe(duration);
      const broken = structuredClone(result);
      broken.video.clips[0].end += 1;
      expect(() =>
        parseEnhancedResult(JSON.stringify(broken), duration, ["ref-1"]),
      ).toThrow("VIDEO_TIMELINE_INVALID");
      expect(() =>
        parseEnhancedResult(JSON.stringify(result), duration, ["wrong"]),
      ).toThrow("IMAGE_REFERENCE_INVALID");
    },
  );
});
describe("independent compliance checks", () => {
  it.each([
    "No.1 pet toy",
    "100% Safe",
    "Vet Approved",
    "Cure Anxiety",
    "Prevent Disease",
    "厂家直销 微信 abc",
    "https://detail.1688.com/offer/123456.html",
  ])("flags %s", (s) =>
    expect(checkProductCompliance(s).publishable).toBe(false),
  );
  it("does not mutate content or treat negative constraints as claims", () => {
    const text =
      "Never claim guaranteed health benefits. Use realistic motion.";
    expect(checkProductCompliance(text).risks).toHaveLength(0);
    expect(
      checkProductCompliance("Only one replacement roll included.").risks,
    ).toHaveLength(0);
    expect(
      checkProductCompliance("One replacement roll included.").risks,
    ).toHaveLength(0);
  });
  it("requires unknown brand authorization but accepts confirmed authorization", () => {
    expect(
      checkProductCompliance("Pet product", {
        name: "Brand A",
        authorized: false,
      }).risks[0].category,
    ).toBe("brand");
    expect(
      checkProductCompliance("Pet product", {
        name: "Brand A",
        authorized: true,
      }).risks,
    ).toHaveLength(0);
  });
  it("rechecks edited marketing content", () => {
    expect(checkProductCompliance("Play with your cat.").risks).toHaveLength(0);
    expect(
      checkProductCompliance("Play with your cat. Cure Anxiety").publishable,
    ).toBe(false);
  });
});
