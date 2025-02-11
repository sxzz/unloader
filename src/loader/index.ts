import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import remapping from '@ampproject/remapping'
import type {
  FalsyValue,
  LoadResult,
  Plugin,
  ResolvedId,
  ResolveMeta,
} from '../plugin'
import { loadConfig } from './config.ts'
import { attachSourceMap } from './map.ts'
import { initRpc, log, rpc } from './rpc.ts'
import type {
  InitializeHook,
  LoadFnOutput,
  LoadHook,
  ModuleSource,
  ResolveHook,
} from 'node:module'
import type { MessagePort } from 'node:worker_threads'

export interface Data {
  port: MessagePort
}

// eslint-disable-next-line import/no-mutable-exports
export let data: Data
let plugins: Plugin[]

export const initialize: InitializeHook = async (_data: Data) => {
  data = _data
  const { port } = data
  initRpc(port)

  let config = await loadConfig()

  for (const plugin of config.plugins || []) {
    config = plugin.options?.(config) || config
  }

  for (const plugin of config.plugins || []) {
    await plugin.buildStart?.({ port, log })

    rpc.debug(`loaded plugin: ${plugin.name}`)
  }

  if (config.sourcemap && !process.sourceMapsEnabled) {
    rpc.enableSourceMap(true)
  }

  plugins = config.plugins || []
}

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  if (plugins) {
    for (const plugin of plugins) {
      const result = await plugin.resolveId?.call(
        { resolve },
        urlToPath(specifier),
        urlToPath(context.parentURL),
        {
          conditions: context.conditions,
          attributes: context.importAttributes,
        },
      )

      if (result) {
        if (typeof result === 'string')
          return {
            url: pathToUrl(result),
            importAttributes: context.importAttributes,
            shortCircuit: true,
          }

        return {
          url: pathToUrl(result.id),
          format: result.format,
          importAttributes: result.attributes || context.importAttributes,
          shortCircuit: true,
        }
      }
    }
  }

  return nextResolve(specifier, context)

  async function resolve(
    source: string,
    importer?: string,
    options?: ResolveMeta,
  ): Promise<ResolvedId | null> {
    try {
      const resolved = await nextResolve(pathToUrl(source), {
        parentURL: importer,
        conditions: options?.conditions,
        importAttributes: options?.attributes,
      })
      return {
        id: urlToPath(resolved.url),
        attributes: resolved.importAttributes,
        format: resolved.format,
      }
    } catch {
      return null
    }
  }
}

export const load: LoadHook = async (url, context, nextLoad) => {
  if (!plugins) return nextLoad(url, context)

  let result: LoadFnOutput | undefined
  const defaultFormat = context.format || 'module'
  const maps: any[] = []

  // load hook
  for (const plugin of plugins) {
    const loadResult = await plugin.load?.(urlToPath(url), {
      format: context.format,
      conditions: context.conditions,
      attributes: context.importAttributes,
    })

    if (loadResult) {
      if (isModuleSource(loadResult)) {
        result = {
          source: loadResult,
          format: defaultFormat,
          shortCircuit: true,
        }
      } else {
        if (loadResult.map) maps.unshift(loadResult.map)
        result = {
          source: loadResult.code,
          format: loadResult.format || defaultFormat,
          shortCircuit: true,
        }
      }
      break
    }
  }

  result ||= await nextLoad(url, context)

  // transform hook
  for (const plugin of plugins) {
    const transformResult: ModuleSource | LoadResult | FalsyValue =
      await plugin.transform?.(result.source, urlToPath(url), {
        format: result.format,
        conditions: context.conditions,
        attributes: context.importAttributes,
      })
    if (transformResult) {
      if (isModuleSource(transformResult)) {
        result = { ...result, source: transformResult }
      } else {
        if (transformResult.map) maps.unshift(transformResult.map)
        result = {
          ...result,
          source: transformResult.code,
          format: transformResult.format || result.format,
        }
      }
    }
  }

  if (maps.length && typeof result.source === 'string') {
    const map = remapping(maps, () => null)
    const code = attachSourceMap(map, result.source)
    result.source = code
  }

  return result
}

function isModuleSource(v: unknown): v is ModuleSource {
  return (
    typeof v === 'string' || ArrayBuffer.isView(v) || v instanceof ArrayBuffer
  )
}

export function urlToPath(url: string): string
export function urlToPath(url: string | undefined): string | undefined
export function urlToPath(url: string | undefined): string | undefined {
  if (!url) return url
  return url.startsWith('file://') ? fileURLToPath(url) : url
}

export function pathToUrl(path: string): string {
  if (
    path.startsWith('file://') ||
    path.startsWith('data://') ||
    path.startsWith('node:')
  )
    return path
  return pathToFileURL(path).href
}
