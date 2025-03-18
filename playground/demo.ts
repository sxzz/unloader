// @ts-check

import { readFile } from '@quansync/fs'
import MagicString from 'magic-string'
import { quansync } from 'quansync'
import type { Plugin, PluginContext, ResolvedId, ResolveFn } from '../src'

let context: PluginContext

export function demoPlugin(): Plugin {
  return {
    name: 'demo-plugin',
    options(config) {
      config.sourcemap = true
    },
    buildStart(_context) {
      context = _context
      context.log('[plugin] build start')
    },
    resolveId: quansync(function* (
      this: { resolve: ResolveFn },
      source,
      importer,
      options,
    ) {
      if (source.startsWith('node:')) return
      if (source === 'virtual-mod') {
        return '/virtual-mod'
      }

      const id = `${source.replace('prefix_', '')}.js`
      const result = (yield this.resolve(
        id,
        importer,
        options,
      )) as ResolvedId | null
      if (result) return result
    }),
    load: quansync(function* (id: string) {
      if (id === '/virtual-mod') {
        return { code: 'export const count = 42' }
      }
      if (id.endsWith('trace.js')) {
        const code = (yield readFile(id, 'utf8')) as string
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
    }),
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
