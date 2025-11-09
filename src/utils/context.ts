import { version } from '../../package.json'
import type { PluginContext } from '../plugin'

export const sharedPluginContext: Pick<PluginContext, 'error' | 'meta'> = {
  error: (message) => {
    throw typeof message === 'string' ? new Error(message) : message
  },
  meta: {
    unloaderVersion: version,
  },
}
