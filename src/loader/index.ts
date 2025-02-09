import type {
  FalsyValue,
  LoadResult,
  Plugin,
  ResolvedId,
  ResolveMeta,
} from '../plugin'
import { loadConfig } from './config.ts'
import { log } from './rpc.ts'
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

  const config = await loadConfig()
  for (const plugin of config.plugins || []) {
    await plugin.buildStart?.({ port, log })

    log(`loaded plugin: ${plugin.name}`, undefined, true)
  }

  plugins = config.plugins || []
}

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  if (plugins) {
    for (const plugin of plugins) {
      const result = await plugin.resolveId?.call(
        { resolve },
        specifier,
        context.parentURL,
        {
          conditions: context.conditions,
          attributes: context.importAttributes,
        },
      )

      if (result) {
        if (typeof result === 'string')
          return {
            url: result,
            importAttributes: context.importAttributes,
            shortCircuit: true,
          }

        return {
          url: result.id,
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
}

export const load: LoadHook = async (url, context, nextLoad) => {
  if (!plugins) return nextLoad(url, context)

  let result: LoadFnOutput | undefined
  const defaultFormat = context.format || 'module'

  // load hook
  for (const plugin of plugins) {
    const loadResult = await plugin.load?.(url, {
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
  for (const plugin of plugins) {
    const transformResult: ModuleSource | LoadResult | FalsyValue =
      await plugin.transform?.(result.source, url, {
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
        result = { ...result, source: transformResult }
      } else {
        result = {
          ...result,
          source: transformResult.code,
          format: transformResult.format || result.format,
        }
      }
    }
  }

  return result
}
