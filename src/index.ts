import type { UnloaderConfig } from './utils/config.ts'

export * from './api.ts'
export * from './plugin.ts'
export * from './utils/config.ts'

export function defineConfig(config: UnloaderConfig): UnloaderConfig {
  return config
}
