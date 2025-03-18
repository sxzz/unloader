import { fileURLToPath, pathToFileURL } from 'node:url'

export function urlToPath(url: string): string
export function urlToPath(url: string | undefined): string | undefined
export function urlToPath(url: string | undefined): string | undefined {
  if (!url) return url
  return url.startsWith('file://') ? fileURLToPath(url) : url
}

export function pathToUrl(isAsync: boolean, path: string): string {
  if (
    !isAsync ||
    path.startsWith('file://') ||
    path.startsWith('data://') ||
    path.startsWith('node:')
  )
    return path
  return pathToFileURL(path).href
}
