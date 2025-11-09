// @ts-check
import assert from 'node:assert'
import { createRequire } from 'node:module'
import { it } from 'node:test'
import { register, registerSync } from '../dist/index.mjs'

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
  const unregister = require('../dist/index.mjs').registerSync()

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

it('resolve inline config (async)', () => {
  const config = function config() {
    return {
      plugins: [
        {
          name: 'inline-plugin-async',
          buildStart() {
            throw new Error('inline-plugin-async')
          },
        },
      ],
    }
  }
  const code = `${config.toString()};export default config()`.replaceAll(
    '\n',
    '',
  )
  const specifier = `data:text/javascript,${code}`
  assert.throws(() => register(specifier), /inline-plugin-async/)
})

it('resolve inline config (sync)', () => {
  let flag = false
  const unregister = registerSync({
    plugins: [
      {
        name: 'inline-plugin-sync',
        buildStart() {
          flag = true
        },
      },
    ],
  })

  assert(flag)

  unregister()
})
