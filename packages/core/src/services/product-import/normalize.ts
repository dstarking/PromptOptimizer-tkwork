import type { ProductSnapshot, ProductImage, ProductSku } from "./types";
export interface RawProductPage {
  url: string;
  title: string;
  tables: string[][][];
  description: string;
  colors: { label: string; selected: boolean; image?: string }[];
  rows: { label: string; text: string; image?: string }[];
  images: {
    url: string;
    width: number;
    height: number;
    kind: "main" | "detail";
  }[];
}
export function validate1688Url(input: string): string {
  const u = new URL(input);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "detail.1688.com" ||
    u.port ||
    u.username ||
    u.password ||
    !/^\/offer\/\d{6,20}\.html$/.test(u.pathname)
  )
    throw new Error("INVALID_PRODUCT_URL");
  return u.origin + u.pathname;
}
export function normalizeProductPages(
  pages: RawProductPage[],
): ProductSnapshot {
  const p = pages[0];
  if (!p || !p.title || !p.rows.length)
    throw new Error("PRODUCT_FIELDS_INCOMPLETE");
  const sourceUrl = validate1688Url(p.url);
  if (pages.some((x) => validate1688Url(x.url) !== sourceUrl))
    throw new Error("PRODUCT_ID_CHANGED");
  if (
    pages.some((x) => !x.rows.length) ||
    (p.colors.length && pages.length !== p.colors.length)
  )
    throw new Error("SKU_RELATION_INCOMPLETE");
  const attributes = (p.tables[0] || []).flatMap((row) => {
    const pairs = [];
    for (let i = 0; i + 1 < row.length; i += 2)
      pairs.push({ name: row[i], value: row[i + 1], confirmed: false });
    return pairs;
  });
  const images: ProductImage[] = [];
  const addImage = (
    url: string | undefined,
    kind: ProductImage["kind"],
    skuId?: string,
  ) => {
    if (!url) return undefined;
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      return undefined;
    }
    if (
      u.protocol !== "https:" ||
      u.hostname !== "cbu01.alicdn.com" ||
      !u.pathname.startsWith("/img/ibank/") ||
      u.username ||
      u.password ||
      u.port
    )
      return undefined;
    let image = images.find((i) => i.url === url);
    if (!image) {
      const meta = p.images.find((i) => i.url === url);
      image = {
        id: "image-" + images.length,
        url,
        kind,
        quality: url.includes("_sum.") ? "thumbnail" : "display",
        width: meta?.width,
        height: meta?.height,
        skuIds: [],
      };
      images.push(image);
    }
    if (skuId && !image.skuIds.includes(skuId)) image.skuIds.push(skuId);
    return image.id;
  };
  p.images.forEach((i) => addImage(i.url, i.kind));
  const skus: ProductSku[] = [];
  for (const page of pages) {
    const color = page.colors.find((c) => c.selected);
    for (const row of page.rows) {
      const options: Record<string, string> = color
        ? { colour: color.label, specification: row.label }
        : { specification: row.label };
      const id = "display:" + JSON.stringify(options);
      if (skus.some((s) => s.id === id)) continue;
      const price = row.text.match(/¥\s*([\d.]+)/)?.[1];
      const stock = row.text.match(/库存\s*(\d+)/)?.[1];
      const rawImage = row.image || color?.image;
      // Prefer the actually observed display URL matching the thumbnail's asset, never invent an original URL.
      const stem = rawImage?.split(".jpg")[0];
      const imageUrl = stem
        ? p.images.find((i) => i.url.split(".jpg")[0] === stem)?.url || rawImage
        : undefined;
      const imageId = addImage(imageUrl, "sku", id);
      skus.push({
        id,
        label: color ? color.label + " / " + row.label : row.label,
        options,
        price: price ? Number(price) : undefined,
        stock: stock ? Number(stock) : undefined,
        imageIds: imageId ? [imageId] : [],
      });
    }
  }
  const conflicts: string[] = [];
  if (
    (p.tables[1] || [])
      .slice(1)
      .some((row) => row.length >= 7 && row.slice(2).every((v) => v === "1"))
  )
    conflicts.push("PACKAGING_PLACEHOLDER");
  if (p.description.includes("饲养缸") && !p.title.includes("缸"))
    conflicts.push("DESCRIPTION_PRODUCT_MISMATCH");
  return {
    source: "1688",
    sourceUrl,
    productId: sourceUrl.match(/\/offer\/(\d+)/)![1],
    capturedAt: new Date().toISOString(),
    title: p.title,
    description: p.description,
    attributes,
    skus,
    images,
    evidence: [
      { field: "title", rawValue: p.title, source: sourceUrl, confirmed: true },
      {
        field: "packaging",
        rawValue: JSON.stringify(p.tables[1] || []),
        source: sourceUrl,
        confirmed: false,
      },
    ],
    missingFields: [
      "ORIGINAL_IMAGES_UNVERIFIED",
      "DETAIL_COMPLETENESS_UNVERIFIED",
      "SOURCE_SKU_IDS_UNAVAILABLE",
    ],
    conflicts,
  };
}
