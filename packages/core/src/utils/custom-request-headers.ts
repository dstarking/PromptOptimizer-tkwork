export type CustomRequestHeaders = Record<string, string>

export type CustomRequestHeaderInput =
  | CustomRequestHeaders
  | Array<{
      key?: unknown
      name?: unknown
      value?: unknown
    }>
  | undefined
  | null

export type CustomRequestHeaderErrorReason =
  | 'invalid-name'
  | 'forbidden-name'
  | 'missing-value'
  | 'invalid-value'

export interface CustomRequestHeaderValidationError {
  key: string
  reason: CustomRequestHeaderErrorReason
}

export interface CustomRequestHeaderValidationResult {
  valid: boolean
  errors: CustomRequestHeaderValidationError[]
}

const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

const FORBIDDEN_CUSTOM_REQUEST_HEADERS = new Set([
  'authorization',
  'connection',
  'content-length',
  'content-type',
  'cookie',
  'host',
  'keep-alive',
  'origin',
  'proxy-authenticate',
  'proxy-authorization',
  'referer',
  'set-cookie',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'user-agent',
])

const FORBIDDEN_CUSTOM_REQUEST_HEADER_PREFIXES = [
  'proxy-',
  'sec-',
  'x-stainless-',
]

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isForbiddenHeaderName(name: string): boolean {
  const normalized = name.toLowerCase()
  return (
    FORBIDDEN_CUSTOM_REQUEST_HEADERS.has(normalized) ||
    FORBIDDEN_CUSTOM_REQUEST_HEADER_PREFIXES.some(prefix => normalized.startsWith(prefix))
  )
}

function toHeaderEntries(input: CustomRequestHeaderInput): Array<{ key: string; value: unknown }> {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input.map(row => ({
      key: String(row.key ?? row.name ?? '').trim(),
      value: row.value,
    }))
  }

  if (isPlainObject(input)) {
    return Object.entries(input).map(([key, value]) => ({
      key: key.trim(),
      value,
    }))
  }

  return []
}

export function validateCustomRequestHeaders(
  input: CustomRequestHeaderInput
): CustomRequestHeaderValidationResult {
  const errors: CustomRequestHeaderValidationError[] = []

  for (const { key, value } of toHeaderEntries(input)) {
    const stringValue = typeof value === 'string' ? value.trim() : value
    const isCompletelyBlank = !key && (stringValue === undefined || stringValue === null || stringValue === '')
    if (isCompletelyBlank) {
      continue
    }

    if (!key || !HEADER_NAME_PATTERN.test(key)) {
      errors.push({ key: key || '(empty)', reason: 'invalid-name' })
      continue
    }

    if (isForbiddenHeaderName(key)) {
      errors.push({ key, reason: 'forbidden-name' })
      continue
    }

    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push({ key, reason: 'missing-value' })
      continue
    }

    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      errors.push({ key, reason: 'invalid-value' })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function normalizeCustomRequestHeaders(
  input: CustomRequestHeaderInput
): CustomRequestHeaders | undefined {
  const headers: CustomRequestHeaders = {}

  for (const { key, value } of toHeaderEntries(input)) {
    const stringValue = value === undefined || value === null ? '' : String(value).trim()

    if (!key && !stringValue) {
      continue
    }

    if (!key || !HEADER_NAME_PATTERN.test(key) || isForbiddenHeaderName(key) || !stringValue) {
      continue
    }

    headers[key] = stringValue
  }

  return Object.keys(headers).length > 0 ? headers : undefined
}
