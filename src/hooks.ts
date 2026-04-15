import path from 'node:path'
import remapping from '@jridgewell/remapping'
import {
  normalizePluginHook,
  type FalsyValue,
  type LoadResult,
  type PluginContext,
  type ResolveMeta,
} from './plugin'
import { createFilterForId, createFilterForTransform } from './plugin-filter'
import { loadConfig, type UnloaderConfig } from './utils/config'
import { attachSourceMap } from './utils/map'
import { pathToUrl, urlToPath } from './utils/url'
import type {
  LoadFnOutput,
  LoadHookContext,
  ModuleSource,
  ResolveFnOutput,
  ResolveHookContext,
} from 'node:module'

type NextResolve = (
  specifier: string,
  context?: Partial<ResolveHookContext>,
) => ResolveFnOutput

type NextLoad = (
  url: string,
  context?: Partial<LoadHookContext>,
) => LoadFnOutput

export function createHooks(): {
  init: (
    context: PluginContext,
    inlineConfig?: UnloaderConfig,
  ) => UnloaderConfig
  resolve: (
    specifier: string,
    context: ResolveHookContext,
    nextResolve: NextResolve,
  ) => ResolveFnOutput
  load: (
    url: string,
    context: LoadHookContext,
    nextLoad: NextLoad,
  ) => LoadFnOutput
  deactivate: () => void
} {
  let config: UnloaderConfig | undefined
  let deactivated = false
  let pluginContext: PluginContext | undefined

  function init(
    context: PluginContext,
    inlineConfig?: UnloaderConfig,
  ): UnloaderConfig {
    pluginContext = context
    config = inlineConfig || loadConfig()

    for (const plugin of config.plugins || []) {
      const { handler } = normalizePluginHook(plugin, 'options')
      config = handler?.call(context, config) || config
    }

    for (const plugin of config.plugins || []) {
      const { handler } = normalizePluginHook(plugin, 'buildStart')
      handler?.call(context)
      context.debug(`loaded plugin: %s`, plugin.name)
    }

    return config
  }

  function resolve(
    specifier: string,
    context: ResolveHookContext,
    nextResolve: NextResolve,
  ): ResolveFnOutput {
    if (deactivated) return nextResolve(specifier, context)

    const isRequire =
      !Array.isArray(context.conditions) || context.conditions[0] === 'require'

    pluginContext?.debug(`resolving %s with context %o`, specifier, context)

    if (config?.plugins && pluginContext) {
      for (const plugin of config.plugins) {
        const resolveFn = createResolve(
          nextResolve,
          isRequire,
          pluginContext.debug,
        )
        const { handler, filter } = normalizePluginHook(plugin, 'resolveId')

        const filterFn = createFilterForId(filter?.id)
        const id = urlToPath(specifier)
        if (filterFn && !filterFn(id)) {
          continue
        }

        const result = handler?.call(
          {
            resolve: resolveFn,
            ...pluginContext,
          },
          id,
          urlToPath(context.parentURL),
          {
            conditions: context.conditions,
            attributes: context.importAttributes,
          },
        )

        if (result) {
          let output: ResolveFnOutput
          if (typeof result === 'string') {
            output = {
              url: pathToUrl(isRequire, result),
              importAttributes: context.importAttributes,
              shortCircuit: true,
            }
          } else {
            output = {
              url: pathToUrl(isRequire, result.id),
              format: result.format,
              importAttributes: result.attributes || context.importAttributes,
              shortCircuit: true,
            }
          }

          pluginContext.debug(
            `resolved %s to %s with format %s`,
            specifier,
            output.url,
            output.format,
          )
          return output
        }
      }
    }

    return nextResolve(specifier, context)
  }

  function load(
    url: string,
    context: LoadHookContext,
    nextLoad: NextLoad,
  ): LoadFnOutput {
    if (deactivated || !config?.plugins) return nextLoad(url, context)

    pluginContext?.debug(`load %s with context %o`, url, context)

    let result: LoadFnOutput | undefined
    const defaultFormat = context.format || 'module'
    const maps: any[] = []

    // load hook
    for (const plugin of config.plugins) {
      const { handler, filter } = normalizePluginHook(plugin, 'load')

      const filterFn = createFilterForId(filter?.id)
      const id = urlToPath(url)
      if (filterFn && !filterFn(id)) {
        continue
      }

      const loadResult = handler?.call(pluginContext!, id, {
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

    result ||= nextLoad(url, context)

    // transform hook
    for (const plugin of config.plugins) {
      const { handler, filter } = normalizePluginHook(plugin, 'transform')

      const filterFn = createFilterForTransform(filter?.id, filter?.code)
      const code: ModuleSource = result.source || ''
      const id = urlToPath(url)
      if (filterFn && (typeof code !== 'string' || !filterFn(id, code || ''))) {
        continue
      }

      const transformResult: ModuleSource | LoadResult | FalsyValue =
        handler?.call(pluginContext!, code, id, {
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

  const deactivate = () => {
    deactivated = true
  }

  return { init, resolve, load, deactivate }
}

function createResolve(
  nextResolve: NextResolve,
  isRequire: boolean,
  debug: PluginContext['debug'],
) {
  return (source: string, importer?: string, options?: ResolveMeta) => {
    if (!path.isAbsolute(source) && importer) {
      source = path.resolve(importer, '..', source)
    }

    try {
      const resolved = nextResolve(pathToUrl(isRequire, source), {
        parentURL: importer,
        conditions: options?.conditions,
        importAttributes: options?.attributes,
      })
      debug(
        'resolved %s to %s with format %s',
        source,
        resolved.url,
        resolved.format,
      )
      return {
        id: urlToPath(resolved.url),
        attributes: resolved.importAttributes,
        format: resolved.format,
      }
    } catch (error) {
      debug('error resolving %s: %o', source, error)
      return null
    }
  }
}

function isModuleSource(v: unknown): v is ModuleSource {
  return (
    typeof v === 'string' || ArrayBuffer.isView(v) || v instanceof ArrayBuffer
  )
}
