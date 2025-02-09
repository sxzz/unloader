import process from 'node:process'
import { loadConfig as unconfig } from 'unconfig'
import type { Plugin } from '../plugin.ts'

export interface UnloaderConfig {
  plugins: Plugin[]
}

export async function loadConfig(): Promise<UnloaderConfig> {
  const { config } = await unconfig<UnloaderConfig>({
    sources: [
      {
        files: 'unloader.config',
        extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', ''],
      },
    ],
    cwd: process.cwd(),
    defaults: { plugins: [] },
  })

  return config
}
