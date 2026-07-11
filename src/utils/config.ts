import process from 'node:process'
import { createConfigCoreLoader } from 'unconfig-core'
import type { Plugin } from '../plugin.ts'
import path from 'node:path'

export interface UnloaderConfig {
  sourcemap?: boolean
  plugins?: Plugin[]
}

export function loadConfig(): UnloaderConfig {
  const [{ config }] = createConfigCoreLoader<UnloaderConfig>({
    sources: [
      {
        files: ['unloader.config'],
        extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', ''],
        parser(filepath) {
          const mod = require(path.resolve(filepath))
          return mod?.default || mod
        },
      },
    ],
    cwd: process.cwd(),
  }).load.sync()

  return config
}
