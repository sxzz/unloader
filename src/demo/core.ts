// @ts-check

import type { Plugin, PluginContext } from '../plugin'

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
    const result = await this.resolve(`${source}.ts`, importer, options)
    if (result) return result
  },
  // load(id, options) {
  //   context.log([id, options])
  //   return {
  //     code: 'module.exports = 42',
  //     format: 'commonjs',
  //   }
  // },
}

// eslint-disable-next-line import/no-default-export
export default plugin
