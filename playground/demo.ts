// @ts-check

import { readFile } from 'node:fs/promises'
import MagicString from 'magic-string'
import type { Plugin, PluginContext } from '../src'

let context: PluginContext

export function demoPlugin(): Plugin {
  return {
    name: 'demo-plugin',
    options(config) {
      config.sourcemap = true
    },
    buildStart(_context) {
      context = _context
      context.log('hello world')
    },
    async resolveId(source, importer, options) {
      if (source.startsWith('node:')) return

      if (source === 'virtual-mod') {
        return '/virtual-mod'
      }

      const result = await this.resolve(`${source}.js`, importer, options)
      if (result) return result
    },
    async load(id) {
      if (id === '/virtual-mod') {
        return { code: 'export const count = 42' }
      }
      if (id.endsWith('trace.js')) {
        const code = await readFile(id, 'utf8')
        const s = new MagicString(code)
        s.prepend('// header\n')
        const map = s.generateMap({
          file: id,
          hires: 'boundary',
          includeContent: true,
        })
        return {
          code: s.toString(),
          map,
        }
      }
    },
    transform(code, id) {
      if (id.endsWith('trace.js') && typeof code === 'string') {
        const s = new MagicString(code)
        s.prepend('// header2\n')
        const map = s.generateMap({
          file: id,
          hires: 'boundary',
          includeContent: true,
        })
        return {
          code: s.toString(),
          map,
        }
      }
    },
  }
}
