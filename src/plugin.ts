import type { UnloaderConfig } from './utils/config'
import type { ImportAttributes, ModuleFormat, ModuleSource } from 'node:module'
import type { MessagePort, TransferListItem } from 'node:worker_threads'
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
  log: (message: any, transferList?: TransferListItem[]) => void
  debug: (...args: any[]) => void
}

export type ConditionalAwaitable<C, T> =
  | (C extends true ? T : Awaitable<T>)
  | QuansyncAwaitableGenerator<T>

export type ResolveFn<Sync = false> = (
  source: string,
  importer?: string,
  options?: ResolveMeta,
) => ConditionalAwaitable<Sync, ResolvedId | null>

export interface Plugin<Sync = false> {
  name: string
  options?: (config: UnloaderConfig<Sync>) => UnloaderConfig<Sync> | FalsyValue
  buildStart?: (context: PluginContext) => ConditionalAwaitable<Sync, void>
  resolveId?: (
    this: { resolve: ResolveFn<Sync> },
    source: string,
    importer: string | undefined,
    options: ResolveMeta,
  ) => ConditionalAwaitable<Sync, string | ResolvedId | FalsyValue>
  load?: (
    id: string,
    options: ResolveMeta & {
      format: ModuleFormat | (string & {}) | null | undefined
    },
  ) => ConditionalAwaitable<Sync, ModuleSource | LoadResult | FalsyValue>
  transform?: (
    code: ModuleSource,
    id: string,
    options: ResolveMeta & { format: ModuleFormat | null | undefined },
  ) => ConditionalAwaitable<Sync, ModuleSource | LoadResult | FalsyValue>
}
