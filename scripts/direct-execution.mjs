import path from 'node:path'
import { pathToFileURL } from 'node:url'

const WINDOWS_DRIVE_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/u
const WINDOWS_UNC_ABSOLUTE_PATH = /^\\\\[^\\]+\\[^\\]+/u

export function toComparableFileUrl(scriptPath) {
  if (!scriptPath) {
    return null
  }

  if (scriptPath.startsWith('file:')) {
    return new URL(scriptPath).href
  }

  if (WINDOWS_DRIVE_ABSOLUTE_PATH.test(scriptPath)) {
    return new URL(`file:///${scriptPath.replace(/\\/g, '/')}`).href
  }

  if (WINDOWS_UNC_ABSOLUTE_PATH.test(scriptPath)) {
    const normalizedPath = scriptPath.replace(/^\\\\/u, '').replace(/\\/g, '/')
    return new URL(`file://${normalizedPath}`).href
  }

  return pathToFileURL(path.resolve(scriptPath)).href
}
