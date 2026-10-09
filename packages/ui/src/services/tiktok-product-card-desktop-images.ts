import {
  DEFAULT_MAX_SOURCE_IMAGE_BYTES,
  ImagePreparationError,
} from "../utils/image-compression";

// 1688 serves WebP display copies. Adapt only the desktop entrance, keeping the shared JPG/PNG pipeline unchanged.
export async function adaptDesktopProductImage(file: File): Promise<File> {
  if (file.type !== "image/webp") return file;
  if (file.size > DEFAULT_MAX_SOURCE_IMAGE_BYTES)
    throw new ImagePreparationError(
      "source-too-large",
      "Image exceeds the source size limit",
    );
  const bitmap = await createImageBitmap(file);
  try {
    // Bound the lossless conversion allocation; large sources require seller-provided JPG/PNG.
    if (
      bitmap.width <= 0 ||
      bitmap.height <= 0 ||
      bitmap.width * bitmap.height > 16_777_216
    )
      throw new ImagePreparationError(
        "compression-failed",
        "WebP dimensions exceed the conversion limit; upload JPG or PNG",
      );
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context)
      throw new ImagePreparationError(
        "compression-failed",
        "Canvas is unavailable",
      );
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(
                new ImagePreparationError(
                  "compression-failed",
                  "WebP conversion failed",
                ),
              ),
        "image/png",
      ),
    );
    return new File([blob], file.name.replace(/(?:\.webp)?$/i, ".png"), {
      type: "image/png",
    });
  } finally {
    bitmap.close();
  }
}
