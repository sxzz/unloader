// @ts-check
import { register } from '../dist/index.js'

register()

// @ts-expect-error
await import('./prefix_trace') // no .js suffix

// @ts-expect-error
const virtualMod = await import('virtual-mod')
console.info(virtualMod)
