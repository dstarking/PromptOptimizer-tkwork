const {
  DEFAULT_IMAGE_INPUT_POLICY,
  normalizeImageMimeType,
} = require('@prompt-optimizer/core');

function createElectronImageInputConverter(nativeImage) {
  return async function convertImageInputWithElectronNativeImage(input) {
    try {
      if (!input || typeof input.b64 !== 'string' || !input.b64.trim()) {
        return null;
      }

      const mimeType = normalizeImageMimeType(input.mimeType) || 'application/octet-stream';
      const source = input.b64.startsWith('data:')
        ? input.b64
        : `data:${mimeType};base64,${input.b64}`;
      const image = nativeImage.createFromDataURL(source);
      if (image.isEmpty()) {
        return null;
      }

      const outputMimeType = mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      const sourceBytes = Buffer.from(
        input.b64.startsWith('data:') ? input.b64.slice(input.b64.indexOf(',') + 1) : input.b64,
        'base64'
      ).length;
      const sourceSize = image.getSize();
      if (
        (mimeType === 'image/jpeg' || mimeType === 'image/png')
        && sourceBytes <= DEFAULT_IMAGE_INPUT_POLICY.maxOutputBytes
        && Math.max(sourceSize.width, sourceSize.height) <= DEFAULT_IMAGE_INPUT_POLICY.maxDimension
      ) {
        return { b64: input.b64, mimeType: outputMimeType };
      }

      const initialScale = Math.min(
        1,
        DEFAULT_IMAGE_INPUT_POLICY.maxDimension / Math.max(sourceSize.width, sourceSize.height)
      );
      let width = Math.max(1, Math.round(sourceSize.width * initialScale));
      let height = Math.max(1, Math.round(sourceSize.height * initialScale));
      let quality = DEFAULT_IMAGE_INPUT_POLICY.jpegQuality;

      for (let attempt = 0; attempt < DEFAULT_IMAGE_INPUT_POLICY.maxAttempts; attempt += 1) {
        const resized = width === sourceSize.width && height === sourceSize.height
          ? image
          : image.resize({ width, height, quality: 'best' });
        const outputBuffer = outputMimeType === 'image/jpeg'
          ? resized.toJPEG(Math.round(quality * 100))
          : resized.toPNG();

        if (outputBuffer && outputBuffer.length <= DEFAULT_IMAGE_INPUT_POLICY.maxOutputBytes) {
          return {
            b64: outputBuffer.toString('base64'),
            mimeType: outputMimeType
          };
        }

        if (outputMimeType === 'image/jpeg' && quality > DEFAULT_IMAGE_INPUT_POLICY.minJpegQuality) {
          quality = Math.max(
            DEFAULT_IMAGE_INPUT_POLICY.minJpegQuality,
            Number((quality - 0.05).toFixed(2))
          );
          continue;
        }

        const outputBytes = outputBuffer?.length || sourceBytes;
        const estimatedScale = Math.sqrt(DEFAULT_IMAGE_INPUT_POLICY.maxOutputBytes / outputBytes) * 0.92;
        const scale = Math.min(0.9, Math.max(0.5, estimatedScale));
        const nextWidth = Math.max(1, Math.round(width * scale));
        const nextHeight = Math.max(1, Math.round(height * scale));
        if (
          (nextWidth === width && nextHeight === height)
          || (width <= DEFAULT_IMAGE_INPUT_POLICY.minDimension && height <= DEFAULT_IMAGE_INPUT_POLICY.minDimension)
        ) {
          break;
        }
        width = nextWidth;
        height = nextHeight;
        quality = 0.82;
      }

      return null;
    } catch {
      return null;
    }
  };
}

module.exports = {
  createElectronImageInputConverter,
};
