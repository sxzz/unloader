// @ts-check

import type { Plugin, PluginContext, PluginEntry } from '../dist/index.d.ts'
export interface Data {
  count: number
}

let context: PluginContext<Data>

const plugin: Plugin<Data> = {
  buildStart(_context) {
    context = _context
    context.log(`count is ${context.data.count}`)
  },
  async resolveId(source, importer, options) {
    if (source === 'virtual-mod') {
      return 'file:///virtual-mod.ts'
    }
    const result = await this.resolve(`${source}.ts`, importer, options)
    if (result) return result
  },
  load(id) {
    if (id === 'file:///virtual-mod.ts') {
      return { code: 'export const count = 42' }
    }
  },
}

export function demoPlugin(): PluginEntry<Data> {
  return {
    name: 'demo',
    entry: import.meta.url,
    data: { count: 10 },
  }
}

// eslint-disable-next-line import/no-default-export
export default plugin
