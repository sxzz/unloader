import process from 'node:process'
import { createBirpc, type BirpcReturn } from 'birpc'
import { createHooks } from './hooks'
import { sharedPluginContext } from './utils/context'
import type { PluginContext } from './plugin'
import type { MainFunctions } from './rpc'
import type { UnloaderConfig } from './utils/config'
import type { InitializeHook, LoadHook, ResolveHook } from 'node:module'
import type { MessagePort } from 'node:worker_threads'

export interface Data {
  port: MessagePort
  inlineConfig?: string
}
let data: Data

const hooks = createHooks()
const threadFunctions = {
  deactivate(): void {
    hooks.deactivate()
  },
}
export type ThreadFunctions = typeof threadFunctions
let rpc: BirpcReturn<MainFunctions, ThreadFunctions>

export const initialize: InitializeHook = async (_data: Data) => {
  data = _data
  const { port } = data
  rpc = createBirpc(threadFunctions, {
    post: (data) => port.postMessage(data),
    on: (fn) => port.on('message', fn),
  })

  const context: PluginContext = {
    ...sharedPluginContext,
    port,
    log: (...args) => rpc.log(...args),
    debug: (...args) => rpc.debug(...args),
  }
  let inlineConfig: UnloaderConfig<boolean> | undefined
  if (data.inlineConfig) {
    inlineConfig = (await import(data.inlineConfig)).default
  }
  const config = await hooks.init(context, inlineConfig)
  if (config.sourcemap && !process.sourceMapsEnabled) {
    rpc.enableSourceMap(true)
  }
}
export const resolve: ResolveHook = hooks.resolve.async
export const load: LoadHook = hooks.load.async
