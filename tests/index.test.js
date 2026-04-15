// @ts-check
import assert from 'node:assert'
import { createRequire } from 'node:module'
import { it } from 'node:test'
import { register } from '../dist/index.mjs'

const require = createRequire(import.meta.url)

it('register', () => {
  const unregister = require('../dist/index.mjs').register()

  // @ts-expect-error
  const { stack } = require('./prefix_trace')
  assert(stack.includes('trace.js:1:22'))

  // @ts-expect-error
  const virtualMod = require('virtual-mod')
  assert(!!virtualMod)

  unregister()
})

it('unregistered', () => {
  clearRequireCache()
  assert.throws(() => require('./prefix_trace'))
})

function clearRequireCache() {
  Object.keys(require.cache).forEach(function (key) {
    delete require.cache[key]
  })
}

it('resolve inline config', () => {
  let flag = false
  const unregister = register({
    plugins: [
      {
        name: 'inline-plugin',
        buildStart() {
          flag = true
        },
      },
    ],
  })

  assert(flag)

  unregister()
})
