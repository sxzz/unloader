// @ts-check

import type { Plugin, PluginContext } from '../dist/index.d.ts'

let context: PluginContext

export function demoPlugin(): Plugin {
  return {
    name: 'demo-plugin',
    buildStart(_context) {
      context = _context
      context.log('hello world')
    },
    async resolveId(source, importer, options) {
      if (source.startsWith('node:')) return

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
}
