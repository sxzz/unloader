import type { StringFilter } from './plugin-filter'
import type { UnloaderConfig } from './utils/config'
import type { ImportAttributes, ModuleFormat, ModuleSource } from 'node:module'
import type { MessagePort, Transferable } from 'node:worker_threads'
import type { QuansyncAwaitableGenerator } from 'quansync'

export type Awaitable<T> = T | Promise<T>
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
  port?: MessagePort
  log: (message: any, transferList?: Transferable[]) => void
  debug: (...args: any[]) => void
  error: (message: string | Error) => never
  meta: { unloaderVersion: string }
}

export type ConditionalAwaitable<C, T> =
  | (C extends true ? T : Awaitable<T>)
  | QuansyncAwaitableGenerator<T>

export type ResolveFn<Sync = false> = (
  source: string,
  importer?: string,
  options?: ResolveMeta,
) => ConditionalAwaitable<Sync, ResolvedId | null>

export interface Plugin<Sync = false> extends Partial<PluginHooks<Sync>> {
  name: string
}

export interface HookFilter {
  id?: StringFilter | undefined
  code?: StringFilter | undefined
}

export type HookFilterExtension<K extends keyof FunctionPluginHooks<false>> =
  K extends 'transform'
    ? { filter?: HookFilter | undefined }
    : K extends 'load'
      ? { filter?: Pick<HookFilter, 'id'> | undefined }
      : K extends 'resolveId'
        ? { filter?: { id?: StringFilter<RegExp> | undefined } } | undefined
        : {}

export interface FunctionPluginHooks<Sync> {
  options: (
    this: PluginContext,
    config: UnloaderConfig<Sync>,
  ) => UnloaderConfig<Sync> | FalsyValue
  buildStart: (this: PluginContext) => ConditionalAwaitable<Sync, void>
  resolveId: (
    this: PluginContext & { resolve: ResolveFn<Sync> },
    source: string,
    importer: string | undefined,
    options: ResolveMeta,
  ) => ConditionalAwaitable<Sync, string | ResolvedId | FalsyValue>
  load: (
    this: PluginContext,
    id: string,
    options: ResolveMeta & {
      format: ModuleFormat | (string & {}) | null | undefined
    },
  ) => ConditionalAwaitable<Sync, ModuleSource | LoadResult | FalsyValue>
  transform: (
    this: PluginContext,
    code: ModuleSource,
    id: string,
    options: ResolveMeta & { format: string | null | undefined },
  ) => ConditionalAwaitable<Sync, ModuleSource | LoadResult | FalsyValue>
}

export type ObjectHook<T, O = {}> = T | ({ handler: T } & O)

export type PluginHooks<Sync> = {
  [K in keyof FunctionPluginHooks<Sync>]: ObjectHook<
    FunctionPluginHooks<Sync>[K],
    HookFilterExtension<K>
  >
}

export function normalizePluginHook<K extends keyof PluginHooks<false>>(
  plugin: Plugin<false>,
  key: K,
): Partial<
  {
    handler?: FunctionPluginHooks<false>[K]
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
