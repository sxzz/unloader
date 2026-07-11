import pkg from '../../package.json' with { type: 'json' }
import type { PluginContext } from '../plugin.ts'

export const sharedPluginContext: Pick<PluginContext, 'error' | 'meta'> = {
  error: (message) => {
    throw typeof message === 'string' ? new Error(message) : message
  },
  meta: {
    unloaderVersion: pkg.version,
  },
}
