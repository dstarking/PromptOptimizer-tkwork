import { IMAGE_ERROR_CODES } from '../../constants/error-codes'
import { ImageError } from './errors'
import type { ImageInputCompatibilityOptions, ImageInputRef } from './types'

export const DEFAULT_IMAGE_INPUT_POLICY = Object.freeze({
  maxSourceBytes: 50 * 1024 * 1024,
  maxOutputBytes: 10 * 1024 * 1024,
  maxDimension: 4096,
  jpegQuality: 0.9,
  minJpegQuality: 0.6,
  minDimension: 256,
  maxAttempts: 12,
})

const STANDARD_LLM_INPUT_MIME_TYPES = new Set(['image/png', 'image/jpeg'])

export function normalizeImageMimeType(mimeType?: string): string | undefined {
  const mime = mimeType?.trim().toLowerCase()
  return mime === 'image/jpg' ? 'image/jpeg' : mime || undefined
}

export function isStandardLlmInputMimeType(mimeType?: string): boolean {
  const mime = normalizeImageMimeType(mimeType)
  return Boolean(mime && STANDARD_LLM_INPUT_MIME_TYPES.has(mime))
}

export function estimateBase64Bytes(base64: string): number {
  const cleanBase64 = stripDataUrlPrefix(base64)
  const padding = cleanBase64.endsWith('==') ? 2 : cleanBase64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((cleanBase64.length * 3) / 4) - padding)
}

export async function normalizeImageInputForLlm<T extends ImageInputRef>(
  input: T,
  options: ImageInputCompatibilityOptions = {}
): Promise<T> {
  const normalizedMimeType = normalizeImageMimeType(input.mimeType)
  const canonicalInput = normalizedMimeType === input.mimeType
    ? input
    : { ...input, mimeType: normalizedMimeType }
  const sourceBytes = estimateBase64Bytes(canonicalInput.b64)

  if (sourceBytes > DEFAULT_IMAGE_INPUT_POLICY.maxSourceBytes) {
    throw new ImageError(IMAGE_ERROR_CODES.INPUT_IMAGE_TOO_LARGE, undefined, { maxSizeMB: 50 })
  }

  const browserConverter = canUseBrowserCanvasConversion()
    ? convertImageInputWithBrowserCanvas
    : undefined
  const converter = options.imageInputConverter ?? browserConverter

  if (!converter) {
    try {
      validateNormalizedInput(canonicalInput)
      return canonicalInput as T
    } catch (error) {
      throw createNormalizationError(error)
    }
  }

  try {
    const converted = await converter({
      b64: canonicalInput.b64,
      mimeType: canonicalInput.mimeType,
    })
    if (!converted?.b64) {
      throw new Error('Image converter returned no data')
    }

    const normalized = {
      ...canonicalInput,
      b64: stripDataUrlPrefix(converted.b64),
      mimeType: normalizeImageMimeType(converted.mimeType) || 'image/png',
    }
    validateNormalizedInput(normalized)
    return normalized as T
  } catch (error) {
    throw createNormalizationError(error)
  }
}

export async function normalizeImageInputsForLlm<T extends ImageInputRef>(
  inputs: readonly T[] | undefined,
  options: ImageInputCompatibilityOptions = {}
): Promise<T[] | undefined> {
  if (!inputs) {
    return undefined
  }

  return await Promise.all(inputs.map((input) => normalizeImageInputForLlm(input, options)))
}

function validateNormalizedInput(input: ImageInputRef): void {
  if (!isStandardLlmInputMimeType(input.mimeType)) {
    throw new Error(`Unsupported normalized MIME type: ${input.mimeType || 'unknown'}`)
  }
  if (estimateBase64Bytes(input.b64) > DEFAULT_IMAGE_INPUT_POLICY.maxOutputBytes) {
    throw new Error('Normalized image is still larger than 10 MiB')
  }
}

function createNormalizationError(error: unknown): ImageError {
  if (error instanceof ImageError) {
    return error
  }
  const details = error instanceof Error ? error.message : String(error)
  return new ImageError(
    IMAGE_ERROR_CODES.INPUT_IMAGE_NORMALIZATION_FAILED,
    details,
    { details },
  )
}

async function convertImageInputWithBrowserCanvas(input: ImageInputRef): Promise<ImageInputRef | null> {
  if (!canUseBrowserCanvasConversion()) {
    return null
  }

  const bytes = decodeBase64(stripDataUrlPrefix(input.b64))
  if (!bytes) {
    return null
  }

  const inputMimeType = normalizeImageMimeType(input.mimeType)
  const outputMimeType = inputMimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png'
  const blob = new Blob([toArrayBuffer(bytes)], { type: inputMimeType || 'application/octet-stream' })
  const bitmap = await createImageBitmap(blob)

  try {
    const withinDimensions = Math.max(bitmap.width, bitmap.height) <= DEFAULT_IMAGE_INPUT_POLICY.maxDimension
    const withinBytes = bytes.byteLength <= DEFAULT_IMAGE_INPUT_POLICY.maxOutputBytes
    if (withinDimensions && withinBytes && isStandardLlmInputMimeType(inputMimeType)) {
      return {
        b64: stripDataUrlPrefix(input.b64),
        mimeType: outputMimeType,
      }
    }

    const dimensionScale = Math.min(
      1,
      DEFAULT_IMAGE_INPUT_POLICY.maxDimension / Math.max(bitmap.width, bitmap.height),
    )
    let width = clampDimension(bitmap.width * dimensionScale)
    let height = clampDimension(bitmap.height * dimensionScale)
    let quality: number | undefined = outputMimeType === 'image/jpeg'
      ? DEFAULT_IMAGE_INPUT_POLICY.jpegQuality
      : undefined

    for (let attempt = 0; attempt < DEFAULT_IMAGE_INPUT_POLICY.maxAttempts; attempt += 1) {
      const output = await renderBitmapToBlob(bitmap, width, height, outputMimeType, quality)
      if (!output) {
        return null
      }
      if (output.size <= DEFAULT_IMAGE_INPUT_POLICY.maxOutputBytes) {
        return {
          b64: await blobToBase64(output),
          mimeType: outputMimeType,
        }
      }

      if (quality !== undefined && quality > DEFAULT_IMAGE_INPUT_POLICY.minJpegQuality) {
        quality = Math.max(
          DEFAULT_IMAGE_INPUT_POLICY.minJpegQuality,
          Number((quality - 0.05).toFixed(2)),
        )
        continue
      }

      const scale = nextScale(output.size, DEFAULT_IMAGE_INPUT_POLICY.maxOutputBytes)
      const nextWidth = clampDimension(width * scale)
      const nextHeight = clampDimension(height * scale)
      if (
        (nextWidth === width && nextHeight === height)
        || (width <= DEFAULT_IMAGE_INPUT_POLICY.minDimension && height <= DEFAULT_IMAGE_INPUT_POLICY.minDimension)
      ) {
        break
      }
      width = nextWidth
      height = nextHeight
      quality = outputMimeType === 'image/jpeg' ? 0.82 : undefined
    }

    return null
  } finally {
    bitmap.close()
  }
}

function canUseBrowserCanvasConversion(): boolean {
  return (
    typeof Blob !== 'undefined'
    && typeof createImageBitmap === 'function'
    && (typeof document !== 'undefined' || typeof OffscreenCanvas !== 'undefined')
  )
}

async function renderBitmapToBlob(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  mimeType: string,
  quality?: number,
): Promise<Blob | null> {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      return null
    }

    if (mimeType === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
    }
    context.drawImage(bitmap, 0, 0, width, height)
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality)
    })
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d')
    if (!context) {
      return null
    }

    if (mimeType === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
    }
    context.drawImage(bitmap, 0, 0, width, height)
    return await canvas.convertToBlob({ type: mimeType, quality })
  }

  return null
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  return encodeBase64(new Uint8Array(buffer))
}

function decodeBase64(base64: string): Uint8Array | null {
  if (!base64 || typeof atob !== 'function') {
    return null
  }

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof btoa !== 'function') {
    return ''
  }

  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function clampDimension(value: number): number {
  return Math.max(1, Math.round(value))
}

function nextScale(blobBytes: number, maxBytes: number): number {
  const estimated = Math.sqrt(maxBytes / blobBytes) * 0.92
  return Math.min(0.9, Math.max(0.5, estimated))
}

function stripDataUrlPrefix(value: string): string {
  const commaIndex = value.indexOf(',')
  return value.startsWith('data:') && commaIndex >= 0 ? value.slice(commaIndex + 1) : value
}
