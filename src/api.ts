import module from 'node:module'
import process from 'node:process'
import { createHooks } from './hooks.ts'
import { sharedPluginContext } from './utils/context.ts'
import { debug } from './utils/debug.ts'
import type { PluginContext } from './plugin.ts'
import type { UnloaderConfig } from './utils/config.ts'

export function register(inlineConfig?: UnloaderConfig): () => void {
  const registerHooks = module.registerHooks
  if (!registerHooks) {
    throw new Error(
      `This version of Node.js (${process.version}) does not support module.registerHooks(). Please upgrade to Node v22.15 or v23.5 and above.`,
    )
  }

  const { init, resolve, load, deactivate } = createHooks()

  const context: PluginContext = {
    ...sharedPluginContext,
    log: (message) => console.info(message),
    debug,
  }
  const config = init(context, inlineConfig)
  if (config.sourcemap && !process.sourceMapsEnabled) {
    process.setSourceMapsEnabled(true)
  }

  registerHooks({ resolve, load })

  return deactivate
}
