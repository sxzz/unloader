import { defineConfig } from 'tsdown'
import Quansync from 'unplugin-quansync/rolldown'

export default defineConfig({
  entry: ['./src/index.ts', './src/register.ts', './src/loader/index.ts'],
  format: ['cjs', 'esm'],
  target: 'node18.19',
  clean: true,
  dts: { transformer: 'oxc' },
  platform: 'node',
  plugins: [Quansync()],
})
