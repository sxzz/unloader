import type { UnloaderConfig } from './utils/config.ts'

export * from './plugin'
export * from './api'
export * from './utils/config'

export function defineConfig(config: UnloaderConfig): UnloaderConfig {
  return config
}

export function defineSyncConfig(
  config: UnloaderConfig<true>,
): UnloaderConfig<true> {
  return config
}
