import path from 'node:path'
import remapping from '@ampproject/remapping'
import { getIsAsync } from 'quansync'
import {
  quansync,
  type QuansyncAwaitableGenerator,
  type QuansyncFn,
} from 'quansync/macro'
import { loadConfig, type UnloaderConfig } from './utils/config'
import { attachSourceMap } from './utils/map'
import { pathToUrl, urlToPath } from './utils/url'
import type {
  FalsyValue,
  LoadResult,
  PluginContext,
  ResolveMeta,
} from './plugin'
import type {
  LoadFnOutput,
  LoadHookContext,
  ModuleSource,
  ResolveFnOutput,
  ResolveHookContext,
} from 'node:module'

export type QuansyncAwaitable<T> =
  | T
  | Promise<T>
  | QuansyncAwaitableGenerator<T>

type NextResolve = (
  specifier: string,
  context?: Partial<ResolveHookContext>,
) => QuansyncAwaitable<ResolveFnOutput>

type NextLoad = (
  url: string,
  context?: Partial<LoadHookContext>,
) => QuansyncAwaitable<LoadFnOutput>

export function createHooks(): {
  init: QuansyncFn<UnloaderConfig, [context: PluginContext]>
  resolve: QuansyncFn<
    ResolveFnOutput,
    [specifier: string, context: ResolveHookContext, nextResolve: NextResolve]
  >
  load: QuansyncFn<
    LoadFnOutput,
    [url: string, context: LoadHookContext, nextLoad: NextLoad]
  >
  deactivate: () => void
} {
  let config: UnloaderConfig<false> | undefined
  let deactivated = false

  const init = quansync(async (context: PluginContext) => {
    config = await loadConfig()

    for (const plugin of config.plugins || []) {
      config = plugin.options?.(config) || config
    }

    for (const plugin of config.plugins || []) {
      await plugin.buildStart?.(context)
      context.debug(`loaded plugin: ${plugin.name}`)
    }

    return config
  })

  const resolve = quansync(
    async (
      specifier: string,
      context: ResolveHookContext,
      nextResolve: NextResolve,
    ) => {
      if (deactivated) return nextResolve(specifier, context)

      if (config?.plugins) {
        for (const plugin of config.plugins) {
          const resolve = createResolve(nextResolve)
          const isAsync = await getIsAsync()
          const result = await plugin.resolveId?.call(
            { resolve: isAsync ? resolve : resolve.sync },
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
                url: pathToUrl(isAsync, result),
                importAttributes: context.importAttributes,
                shortCircuit: true,
              }

            return {
              url: pathToUrl(isAsync, result.id),
              format: result.format,
              importAttributes: result.attributes || context.importAttributes,
              shortCircuit: true,
            }
          }
        }
      }

      return nextResolve(specifier, context)
    },
  )

  const load = quansync(
    async (url: string, context: LoadHookContext, nextLoad: NextLoad) => {
      if (deactivated || !config?.plugins) return nextLoad(url, context)

      let result: LoadFnOutput | undefined
      const defaultFormat = context.format || 'module'
      const maps: any[] = []

      // load hook
      for (const plugin of config.plugins) {
        const loadResult = await plugin.load?.(urlToPath(url), {
          format: context.format,
          conditions: context.conditions,
          attributes: context.importAttributes,
        })

        if (loadResult) {
          if (isModuleSource(loadResult)) {
            result = {
              source: loadResult,
              format: defaultFormat as any,
              shortCircuit: true,
            }
          } else {
            if (loadResult.map) maps.unshift(loadResult.map)
            result = {
              source: loadResult.code,
              format: (loadResult.format || defaultFormat) as any,
              shortCircuit: true,
            }
          }
          break
        }
      }

      result ||= await nextLoad(url, context)

      // transform hook
      for (const plugin of config.plugins) {
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
    },
  )

  const deactivate = () => {
    deactivated = true
  }

  return { init, resolve, load, deactivate }
}

function createResolve(nextResolve: NextResolve) {
  return quansync(
    async (source: string, importer?: string, options?: ResolveMeta) => {
      try {
        if (!path.isAbsolute(source) && importer) {
          source = path.resolve(importer, '..', source)
        }

        const isAsync = await getIsAsync()
        const resolved = await nextResolve(pathToUrl(isAsync, source), {
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
    },
  )
}

function isModuleSource(v: unknown): v is ModuleSource {
  return (
    typeof v === 'string' || ArrayBuffer.isView(v) || v instanceof ArrayBuffer
  )
}
