import { defineConfig } from './src/index'
import { demoPlugin } from './tests/demo'

export default defineConfig({
  plugins: [demoPlugin()],
})
