import type { UnloaderConfig } from './loader/config.ts'

export * from './plugin.ts'
export * from './api.ts'
export * from './loader/config.ts'

export function defineConfig(config: UnloaderConfig): UnloaderConfig {
  return config
}
