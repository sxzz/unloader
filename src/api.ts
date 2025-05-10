import module from 'node:module'
import process from 'node:process'
import { createHooks } from './hooks'
import { createRpc } from './rpc'
import { debug } from './utils/debug'
import type { PluginContext } from './plugin'
import type { UnloaderConfig } from './utils/config'
import type { Data } from './worker'

export function register(inlineConfig?: string) {
  if (!module.register) {
    throw new Error(
      `This version of Node.js (${process.version}) does not support module.register(). Please upgrade to Node v18.19 or v20.6 and above.`,
    )
  }

  const { port1, port2 } = new MessageChannel()
  const rpc = createRpc(port1)
  port1.unref()

  const data: Data = { port: port2, inlineConfig }
  const transferList = [port2]
  module.register('./worker.js', {
    parentURL: import.meta.url,
    data,
    transferList,
  })

  return (): Promise<void> => rpc.deactivate()
}

export function registerSync(inlineConfig?: UnloaderConfig<true>): () => void {
  const registerHooks = module.registerHooks
  if (!registerHooks) {
    throw new Error(
      `This version of Node.js (${process.version}) does not support module.registerHooks(). Please upgrade to Node v22.15 or v23.5 and above.`,
    )
  }

  const { init, resolve, load, deactivate } = createHooks()

  const context: PluginContext = {
    log: (message) => console.info(message),
    debug,
  }
  const config = init.sync(context, inlineConfig)
  if (config.sourcemap && !process.sourceMapsEnabled) {
    process.setSourceMapsEnabled(true)
  }

  registerHooks({
    resolve: resolve.sync,
    load: load.sync,
  })

  return deactivate
}
