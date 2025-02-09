// @ts-check
import { register } from '../dist/index.js'
import { demoPlugin } from './demo.ts'

register([demoPlugin()])

const mod = await import('../src/utils') // no .ts suffix
console.info(mod)

const mod2 = await import('virtual-mod')
console.info(mod2)
