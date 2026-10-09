export interface FieldEvidence {
  field: string;
  rawValue: string;
  source: string;
  confirmed: boolean;
}
export interface ProductAttribute {
  name: string;
  value: string;
  confirmed: boolean;
}
export interface ProductSku {
  id: string;
  sourceId?: string;
  label: string;
  options: Record<string, string>;
  price?: number;
  stock?: number;
  imageIds: string[];
}
export interface ProductImage {
  id: string;
  url: string;
  kind: "main" | "sku" | "detail";
  quality: "display" | "thumbnail" | "original";
  width?: number;
  height?: number;
  skuIds: string[];
}
export interface ProductSnapshot {
  source: "1688";
  sourceUrl: string;
  productId: string;
  capturedAt: string;
  title: string;
  description: string;
  attributes: ProductAttribute[];
  skus: ProductSku[];
  images: ProductImage[];
  evidence: FieldEvidence[];
  missingFields: string[];
  conflicts: string[];
}
