// @ts-check
import { register } from '../dist/index.js'

register()

const mod = await import('../src/loader/config') // no .ts suffix
console.info(mod)

const mod2 = await import('virtual-mod')
console.info(mod2)
