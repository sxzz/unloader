import { defineConfig } from './src/index.ts'
import { demoPlugin } from './tests/demo.ts'

export default defineConfig({
  plugins: [demoPlugin()],
})
