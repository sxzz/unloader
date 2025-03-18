import process from 'node:process'
import { createHooks } from '../hooks.ts'
import type { PluginContext } from '../plugin'
import { initRpc, log, rpc } from './rpc.ts'
import type { InitializeHook, LoadHook, ResolveHook } from 'node:module'
import type { MessagePort } from 'node:worker_threads'

export interface Data {
  port: MessagePort
}

// eslint-disable-next-line import/no-mutable-exports
export let data: Data

const hooks = createHooks()
export const initialize: InitializeHook = async (_data: Data) => {
  data = _data
  const { port } = data
  initRpc(port)

  const context: PluginContext = {
    port,
    log,
    debug: (...args) => rpc.debug(...args),
  }
  const config = await hooks.init(context)
  if (config.sourcemap && !process.sourceMapsEnabled) {
    rpc.enableSourceMap(true)
  }
}

export const resolve: ResolveHook = hooks.resolve.async
export const load: LoadHook = hooks.load.async
