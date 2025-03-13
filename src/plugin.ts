import type { UnloaderConfig } from './loader/config'
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
  port: MessagePort
  log: (message: any, transferList?: TransferListItem[]) => void
}

export type ResolveFn = (
  source: string,
  importer?: string,
  options?: ResolveMeta,
) => Promise<ResolvedId | null>

export interface Plugin {
  name: string
  options?: (config: UnloaderConfig) => UnloaderConfig | FalsyValue
  buildStart?: (context: PluginContext) => Awaitable<void>
  resolveId?: (
    this: { resolve: ResolveFn },
    source: string,
    importer: string | undefined,
    options: ResolveMeta,
  ) => Awaitable<string | ResolvedId | FalsyValue>
  load?: (
    id: string,
    options: ResolveMeta & {
      format: ModuleFormat | (string & {}) | null | undefined
    },
  ) => Awaitable<ModuleSource | LoadResult | FalsyValue>
  transform?: (
    code: ModuleSource | undefined,
    id: string,
    options: ResolveMeta & { format: ModuleFormat | null | undefined },
  ) => Awaitable<ModuleSource | LoadResult | FalsyValue>
}
