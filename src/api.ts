import module from 'node:module'
import process from 'node:process'
import { createHooks } from './hooks'
import { createRpc } from './rpc'
import { debug } from './utils/debug'
import type { Data } from './loader/index'
import type { PluginContext } from './plugin'

export function register() {
  if (!module.register) {
    throw new Error(
      `This version of Node.js (${process.version}) does not support module.register(). Please upgrade to Node v18.19 or v20.6 and above.`,
    )
  }

  const { port1, port2 } = new MessageChannel()
  const rpc = createRpc(port1)
  port1.unref()

  const data: Data = { port: port2 }
  const transferList = [port2]
  module.register('./loader/index.js', {
    parentURL: import.meta.url,
    data,
    transferList,
  })

  return (): Promise<void> => rpc.deactivate()
}

export function registerSync(): () => void {
  // @ts-expect-error
  const registerHooks = module.registerHooks
  if (!registerHooks) {
    throw new Error(
      `This version of Node.js (${process.version}) does not support module.registerHooks(). Please upgrade to Node v23.5 or above.`,
    )
  }

  const { init, resolve, load, deactivate } = createHooks()

  const context: PluginContext = {
    log: (message) => console.info(message),
    debug,
  }
  const config = init.sync(context)
  if (config.sourcemap && !process.sourceMapsEnabled) {
    process.setSourceMapsEnabled(true)
  }

  registerHooks({
    resolve: resolve.sync,
    load: load.sync,
  })

  return deactivate
}
