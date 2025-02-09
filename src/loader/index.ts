import { interopDefault } from '../utils.ts'
import type {
  FalsyValue,
  LoadResult,
  ModuleSource,
  Plugin,
  PluginEntry,
  ResolvedId,
  ResolveMeta,
} from '../plugin'
import { log } from './rpc.ts'
import type {
  InitializeHook,
  LoadFnOutput,
  LoadHook,
  ResolveHook,
} from 'node:module'
import type { MessagePort } from 'node:worker_threads'

export interface Data {
  port: MessagePort
  plugins: Record<string, Pick<PluginEntry, 'entry' | 'data'>>
}

// eslint-disable-next-line import/no-mutable-exports
export let data: Data
const plugins: Record<string, Plugin> = Object.create(null)

export const initialize: InitializeHook = async (_data: Data) => {
  data = _data
  const { port } = data

  for (const [name, plugin] of Object.entries(data.plugins)) {
    const mod: Plugin = interopDefault(await import(plugin.entry))
    await mod.buildStart?.({
      port,
      data: plugin.data,
      log,
    })

    plugins[name] = mod
    log(`loaded plugin ${name}`)
  }
}

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  async function resolve(
    source: string,
    importer?: string,
    options?: ResolveMeta,
  ): Promise<ResolvedId | null> {
    try {
      const resolved = await nextResolve(source, {
        parentURL: importer,
        conditions: options?.conditions,
        importAttributes: options?.attributes,
      })
      return {
        id: resolved.url,
        attributes: resolved.importAttributes,
        format: resolved.format,
      }
    } catch {
      return null
    }
  }

  for (const name of Object.keys(data.plugins)) {
    if (!plugins[name]) continue

    const result = await plugins[name].resolveId?.call(
      { resolve },
      specifier,
      context.parentURL,
      { conditions: context.conditions, attributes: context.importAttributes },
    )

    if (result) {
      if (typeof result === 'string')
        return {
          url: result,
          importAttributes: context.importAttributes,
        }

      return {
        url: result.id,
        format: result.format,
        importAttributes: result.attributes || context.importAttributes,
        shortCircuit: result.shortCircuit,
      }
    }
  }

  return nextResolve(specifier, context)
}

export const load: LoadHook = async (url, context, nextLoad) => {
  let result: LoadFnOutput | undefined
  const defaultFormat = context.format || 'module'

  // load hook
  for (const name of Object.keys(data.plugins)) {
    if (!plugins[name]) continue

    const loadResult = await plugins[name].load?.(url, {
      format: context.format,
      conditions: context.conditions,
      attributes: context.importAttributes,
    })

    if (loadResult) {
      if (
        typeof loadResult === 'string' ||
        ArrayBuffer.isView(loadResult) ||
        loadResult instanceof ArrayBuffer
      ) {
        result = {
          source: loadResult,
          format: defaultFormat,
          shortCircuit: true,
        }
      } else {
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
  for (const name of Object.keys(data.plugins)) {
    if (!plugins[name]) continue
    const transformResult: ModuleSource | LoadResult | FalsyValue =
      await plugins[name].transform?.(result.source, url, {
        format: result.format,
        conditions: context.conditions,
        attributes: context.importAttributes,
      })
    if (transformResult) {
      if (
        typeof transformResult === 'string' ||
        ArrayBuffer.isView(transformResult) ||
        transformResult instanceof ArrayBuffer
      ) {
        result = {
          source: transformResult,
          format: result?.format || defaultFormat,
          shortCircuit: result.shortCircuit,
        }
      } else {
        result = {
          source: transformResult.code,
          format: transformResult.format || result.format || defaultFormat,
          shortCircuit: result.shortCircuit,
        }
      }
    }
  }

  return result
}
