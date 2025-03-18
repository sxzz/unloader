import type { UnloaderConfig } from './utils/config.ts'

export * from './plugin.ts'
export * from './api.ts'
export * from './utils/config.ts'

export function defineConfig(config: UnloaderConfig): UnloaderConfig {
  return config
}

export function defineSyncConfig(
  config: UnloaderConfig<true>,
): UnloaderConfig<true> {
  return config
}
