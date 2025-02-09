import { demoPlugin } from './playground/demo.ts'
import { defineConfig } from './src/index.ts'

export default defineConfig({
  plugins: [demoPlugin()],
})
