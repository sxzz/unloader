import process from 'node:process'
import { createBirpc, type BirpcReturn } from 'birpc'
import { createHooks } from '../hooks'
import type { PluginContext } from '../plugin'
import type { MainFunctions } from '../rpc.ts'
import type { InitializeHook, LoadHook, ResolveHook } from 'node:module'
import type { MessagePort } from 'node:worker_threads'

export interface Data {
  port: MessagePort
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
    port,
    log: (...args) => rpc.log(...args),
    debug: (...args) => rpc.debug(...args),
  }
  const config = await hooks.init(context)
  if (config.sourcemap && !process.sourceMapsEnabled) {
    rpc.enableSourceMap(true)
  }
}
export const resolve: ResolveHook = hooks.resolve.async
export const load: LoadHook = hooks.load.async
