// @ts-check
import assert from 'node:assert'
import { createRequire } from 'node:module'
import { it } from 'node:test'
import { register } from '../dist/index.js'

const require = createRequire(import.meta.url)

it('register async', async () => {
  const unregister = register()
  assert(typeof unregister === 'function')

  // @ts-expect-error
  const { stack } = await import('./prefix_trace') // no .js suffix
  assert(stack.includes('trace.js:1:22'))

  // @ts-expect-error
  const virtualMod = await import('virtual-mod')
  assert(!!virtualMod)

  unregister()
})

it('register sync', () => {
  const unregister = require('../dist/index.js').registerSync()

  // @ts-expect-error
  const { stack } = require('./prefix_trace')
  assert(stack.includes('trace.js:1:22'))

  // @ts-expect-error
  const virtualMod = require('virtual-mod')
  assert(!!virtualMod)

  unregister()
})

it('unregistered', async () => {
  // @ts-expect-error
  await assert.rejects(() => import('./prefix_trace'))
  assert.doesNotThrow(() => require('./prefix_trace'))

  clearRequireCache()
  assert.throws(() => require('./prefix_trace'))
})

function clearRequireCache() {
  Object.keys(require.cache).forEach(function (key) {
    delete require.cache[key]
  })
}
