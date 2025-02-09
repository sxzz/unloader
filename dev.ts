import { demoPlugin } from './src/demo/index.ts'
import { register } from './src/index.ts'

register([demoPlugin()])

const mod = await import('./src/utils') // no .ts suffix
console.log(mod)

const mod2 = await import('virtual-mod')
console.log(mod2)
