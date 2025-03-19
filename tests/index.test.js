// @ts-check
import assert from 'node:assert'
import { createRequire } from 'node:module'
import { it } from 'node:test'
import { register } from '../dist/index.js'

it('register async', async () => {
  const unregister = register()
  assert(typeof unregister === 'function')

  // @ts-expect-error
  const { stack } = await import('./prefix_trace') // no .js suffix
  assert(stack.includes('trace.js:1:22'))

  // @ts-expect-error
  const virtualMod = await import('virtual-mod')
  assert(!!virtualMod)
})

it('register sync', () => {
  const require = createRequire(import.meta.url)
  require('../dist/index.js').registerSync()

  // @ts-expect-error
  const { stack } = require('./prefix_trace')
  assert(stack.includes('trace.js:1:22'))

  // @ts-expect-error
  const virtualMod = require('virtual-mod')
  assert(!!virtualMod)
})
