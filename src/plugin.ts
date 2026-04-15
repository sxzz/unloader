import type { StringFilter } from './plugin-filter'
import type { UnloaderConfig } from './utils/config'
import type { ImportAttributes, ModuleFormat, ModuleSource } from 'node:module'

export type FalsyValue = null | undefined | false | void

export interface ResolveMeta {
  /**
   * Export conditions of the relevant `package.json`
   */
  conditions: string[]
  /**
   *  An object whose key-value pairs represent the assertions for the module to import
   */
  attributes: ImportAttributes
}

export interface ResolvedId {
  attributes?: ImportAttributes

  /**
   * The absolute URL to which this input resolves
   */
  id: string
  /**
   * A hint to the load hook (it might be ignored)
   */
  format?: ModuleFormat | (string & {}) | null | undefined
}

export interface LoadResult {
  /**
   * The source for Node.js to evaluate
   */
  code?: ModuleSource | undefined
  map?: any
  format?: ModuleFormat
}

export interface PluginContext {
  log: (message: any) => void
  debug: (...args: any[]) => void
  error: (message: string | Error) => never
  meta: { unloaderVersion: string }
}

export type ResolveFn = (
  source: string,
  importer?: string,
  options?: ResolveMeta,
) => ResolvedId | null

export interface Plugin extends Partial<PluginHooks> {
  name: string
}

export interface HookFilter {
  id?: StringFilter | undefined
  code?: StringFilter | undefined
}

export type HookFilterExtension<K extends keyof FunctionPluginHooks> =
  K extends 'transform'
    ? { filter?: HookFilter | undefined }
    : K extends 'load'
      ? { filter?: Pick<HookFilter, 'id'> | undefined }
      : K extends 'resolveId'
        ? { filter?: { id?: StringFilter<RegExp> | undefined } } | undefined
        : {}

export interface FunctionPluginHooks {
  options: (
    this: PluginContext,
    config: UnloaderConfig,
  ) => UnloaderConfig | FalsyValue
  buildStart: (this: PluginContext) => void
  resolveId: (
    this: PluginContext & { resolve: ResolveFn },
    source: string,
    importer: string | undefined,
    options: ResolveMeta,
  ) => string | ResolvedId | FalsyValue
  load: (
    this: PluginContext,
    id: string,
    options: ResolveMeta & {
      format: ModuleFormat | (string & {}) | null | undefined
    },
  ) => ModuleSource | LoadResult | FalsyValue
  transform: (
    this: PluginContext,
    code: ModuleSource,
    id: string,
    options: ResolveMeta & { format: string | null | undefined },
  ) => ModuleSource | LoadResult | FalsyValue
}

export type ObjectHook<T, O = {}> = T | ({ handler: T } & O)

export type PluginHooks = {
  [K in keyof FunctionPluginHooks]: ObjectHook<
    FunctionPluginHooks[K],
    HookFilterExtension<K>
  >
}

export function normalizePluginHook<K extends keyof PluginHooks>(
  plugin: Plugin,
  key: K,
): Partial<
  {
    handler?: FunctionPluginHooks[K]
  } & HookFilterExtension<K>
> {
  const hook = plugin?.[key]
  if (!hook) {
    return {}
  }
  if (typeof hook === 'function') {
    return { handler: hook } as any
  }
  return hook as any
}
