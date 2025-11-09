// @ts-check

import assert from 'node:assert'
import path from 'node:path'
import { readFile } from '@quansync/fs'
import MagicString from 'magic-string'
import { quansync } from 'quansync'
import type { Plugin, PluginContext, ResolvedId, ResolveFn } from '../src'

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
      handler: quansync(function* (
        this: { resolve: ResolveFn },
        source,
        importer,
        options,
      ) {
        if (source.startsWith('node:')) return
        if (source === 'virtual-mod') {
          return resolvedVirtualMod
        }

        const id = `${source.replace('prefix_', '')}.js`
        const result = (yield this.resolve(
          id,
          importer,
          options,
        )) as ResolvedId | null
        if (result) return result
      }),
    },
    load: {
      filter: {
        id: [resolvedVirtualMod, /trace\.js$/],
      },
      handler: quansync(function* (id: string) {
        if (id === resolvedVirtualMod) {
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
