import { demoPlugin } from './src/demo/index.ts'
import { register } from './src/index.ts'

register([demoPlugin()])

const mod = await import('./src/utils')
console.log(mod)
