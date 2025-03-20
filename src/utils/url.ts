import { fileURLToPath, pathToFileURL } from 'node:url'

export function urlToPath(url: string): string
export function urlToPath(url: string | undefined): string | undefined
export function urlToPath(url: string | undefined): string | undefined {
  if (!url) return url
  return url.startsWith('file://') ? fileURLToPath(url) : url
}

export function pathToUrl(isRequire: boolean, path: string): string {
  if (
    isRequire ||
    path.startsWith('file://') ||
    path.startsWith('data://') ||
    path.startsWith('node:')
  )
    return path
  return pathToFileURL(path).href
}
