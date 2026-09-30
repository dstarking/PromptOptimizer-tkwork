import { VARIABLE_VALIDATION, isValidVariableName } from '../types/variable'

export function scanPromptVariables(content: string): string[] {
  if (typeof content !== 'string' || !content) return []

  VARIABLE_VALIDATION.VARIABLE_SCAN_PATTERN.lastIndex = 0

  const variables: string[] = []
  const matches = content.matchAll(VARIABLE_VALIDATION.VARIABLE_SCAN_PATTERN)

  for (const match of matches) {
    const variableName = match[1]?.trim() || ''
    if (!variableName || !isValidVariableName(variableName)) {
      continue
    }

    if (!variables.includes(variableName)) {
      variables.push(variableName)
    }
  }

  return variables
}

export function replaceTemporaryVariablesForPrompt(
  content: string,
  defaults: Record<string, string>,
  listVariables: () => Record<string, string>,
  setVariable: (name: string, value: string) => void,
  deleteVariable: (name: string) => void
): number {
  const variableNames = scanPromptVariables(content)
  const variableNameSet = new Set(variableNames)
  const existingVariables = listVariables()

  for (const existingName of Object.keys(existingVariables)) {
    if (!variableNameSet.has(existingName)) {
      deleteVariable(existingName)
    }
  }

  for (const name of variableNames) {
    setVariable(name, defaults[name] ?? '')
  }

  return variableNames.length
}
