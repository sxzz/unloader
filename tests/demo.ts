// @ts-check

import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import MagicString from 'magic-string'
import type { Plugin, PluginContext } from '../src'

let context: PluginContext

const resolvedVirtualMod = path.resolve('/virtual-mod')

export function demoPlugin(): Plugin {
  return {
    name: 'demo-plugin',
    options(config) {
      assert(typeof this.meta.unloaderVersion === 'string')
      config.sourcemap = true
    },
    buildStart() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      context = this
      context.log('[plugin] build start')
    },
    resolveId: {
      filter: {
        id: [/node:/, /^virtual-mod$/, /^prefix_/],
      },
      handler(source, importer, options) {
        if (source.startsWith('node:')) return
        if (source === 'virtual-mod') {
          return resolvedVirtualMod
        }

        const id = `${source.replace('prefix_', '')}.js`
        const result = this.resolve(id, importer, options)
        if (result) return result
      },
    },
    load: {
      filter: {
        id: [resolvedVirtualMod, /trace\.js$/],
      },
      handler(id) {
        if (id === resolvedVirtualMod) {
          return { code: 'export const count = 42' }
        }
        if (id.endsWith('trace.js')) {
          const code = readFileSync(id, 'utf8')
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
    },
    transform: {
      filter: {
        id: [/trace\.js$/],
      },
      handler(code, id) {
        if (typeof code === 'string') {
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
    },
  }
}
