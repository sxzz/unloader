// @ts-check
import { register } from '../dist/index.js'

register()

await import('./trace') // no .js suffix

const mod2 = await import('virtual-mod')
console.info(mod2)
