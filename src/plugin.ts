import type { ImportAttributes, ModuleFormat, ModuleSource } from 'node:module'
import type { MessagePort, TransferListItem } from 'node:worker_threads'

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
  format?: ModuleFormat | null | undefined
}

export interface LoadResult {
  /**
   * The source for Node.js to evaluate
   */
  code?: ModuleSource | undefined
  format?: ModuleFormat
}

export interface PluginContext<T> {
  data: T
  port: MessagePort
  log: (message: any, transferList?: TransferListItem[]) => void
}

export interface Plugin<T = any> {
  buildStart?: (context: PluginContext<T>) => Awaitable<void>
  resolveId?: (
    this: {
      resolve: (
        source: string,
        importer?: string,
        options?: ResolveMeta,
      ) => Promise<ResolvedId | null>
    },
    source: string,
    importer: string | undefined,
    options: ResolveMeta,
  ) => Awaitable<string | ResolvedId | FalsyValue>
  load?: (
    id: string,
    options: ResolveMeta & { format: ModuleFormat | null | undefined },
  ) => Awaitable<ModuleSource | LoadResult | FalsyValue>
  transform?: (
    code: ModuleSource | undefined,
    id: string,
    options: ResolveMeta & { format: ModuleFormat | null | undefined },
  ) => Awaitable<ModuleSource | LoadResult | FalsyValue>
}

export interface PluginEntry<T = any> {
  name: string
  entry: string
  data?: T
  transferList?: any[]
}
