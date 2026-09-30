export interface PromptGardenImportRequest {
  importCode: string
  exampleId: string | null
  subModeKey: string | null
}

const parseImportCodeSelector = (value: string): { importCode: string; exampleId: string | null } => {
  const trimmed = value.trim()
  const separatorIndex = trimmed.lastIndexOf('@')
  if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
    return {
      importCode: trimmed,
      exampleId: null,
    }
  }

  const importCode = trimmed.slice(0, separatorIndex).trim()
  const exampleId = trimmed.slice(separatorIndex + 1).trim()
  if (!importCode || !exampleId) {
    return {
      importCode: trimmed,
      exampleId: null,
    }
  }

  return {
    importCode,
    exampleId,
  }
}

const parseQueryParams = (params: URLSearchParams): PromptGardenImportRequest | null => {
  const rawImportCode = params.get('importCode')?.trim()
  if (!rawImportCode) return null

  const parsed = parseImportCodeSelector(rawImportCode)
  const explicitExampleId = params.get('exampleId')?.trim()
  const subModeKey = params.get('subModeKey')?.trim()

  return {
    importCode: parsed.importCode,
    exampleId: explicitExampleId || parsed.exampleId,
    subModeKey: subModeKey || null,
  }
}

export const parsePromptGardenImportInput = (value: string): PromptGardenImportRequest => {
  const trimmed = value.trim()
  if (!trimmed) {
    return {
      importCode: '',
      exampleId: null,
      subModeKey: null,
    }
  }

  try {
    const url = new URL(trimmed)
    const direct = parseQueryParams(url.searchParams)
    if (direct) return direct

    const hashQueryIndex = url.hash.indexOf('?')
    if (hashQueryIndex >= 0) {
      const hashQuery = new URLSearchParams(url.hash.slice(hashQueryIndex + 1))
      const fromHash = parseQueryParams(hashQuery)
      if (fromHash) return fromHash
    }
  } catch {
    // Plain import codes are expected; non-URL values are used as-is.
  }

  const parsed = parseImportCodeSelector(trimmed)
  return {
    importCode: parsed.importCode,
    exampleId: parsed.exampleId,
    subModeKey: null,
  }
}

export const normalizePromptGardenImportCode = (value: string): string => {
  return parsePromptGardenImportInput(value).importCode
}
