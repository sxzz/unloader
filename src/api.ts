import module from 'node:module'
import process from 'node:process'
import { createHooks } from './hooks'
import { createRpc } from './rpc'
import { debug } from './utils/debug'
import type { Data } from './loader/index'
import type { PluginContext } from './plugin'

export function register(): void {
  if (!module.register) {
    throw new Error(
      `This version of Node.js (${process.version}) does not support module.register(). Please upgrade to Node v18.19 or v20.6 and above.`,
    )
  }

  const { port1, port2 } = new MessageChannel()
  createRpc(port1)
  port1.unref()

  const data: Data = { port: port2 }
  const transferList = [port2]
  module.register('./loader/index.js', {
    parentURL: import.meta.url,
    data,
    transferList,
  })
}

export function registerSync(): void {
  // @ts-expect-error
  const registerHooks = module.registerHooks
  if (!registerHooks) {
    throw new Error('CommonJS is not supported yet.')
  }

  const { init, resolve, load } = createHooks()

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
}
