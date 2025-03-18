import process from 'node:process'
import { quansync, type QuansyncFn } from 'quansync/macro'
import { loadConfig as unconfig } from 'unconfig'
import type { Plugin } from '../plugin'

export interface UnloaderConfig<Sync = false> {
  sourcemap?: boolean
  plugins?: Plugin<Sync>[]
}

export const loadConfig: QuansyncFn<UnloaderConfig, []> = quansync(async () => {
  const { config } = await unconfig<UnloaderConfig>({
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
})
