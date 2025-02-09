import path from 'node:path'
import type { PluginEntry } from '../plugin'
import type { Data } from './core'

export function demoPlugin(): PluginEntry<Data> {
  return {
    name: 'demo',
    entry: path.resolve(import.meta.dirname, './core.ts'),
    data: { count: 10 },
  }
}
