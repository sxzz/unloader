import process from 'node:process'
import { loadConfigSync } from 'unconfig'
import type { Plugin } from '../plugin'

export interface UnloaderConfig {
  sourcemap?: boolean
  plugins?: Plugin[]
}

export function loadConfig(): UnloaderConfig {
  const { config } = loadConfigSync<UnloaderConfig>({
    sources: [
      {
        files: 'unloader.config',
        extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', ''],
      },
    ],
    cwd: process.cwd(),
    defaults: {},
  })

  return config
}
