import { defineConfig } from 'tsdown'
import Quansync from 'unplugin-quansync/rolldown'

export default defineConfig({
  entry: ['./src/{index,register,register-sync}.ts', './src/loader/index.ts'],
  target: 'node18.19',
  clean: true,
  dts: { transformer: 'oxc' },
  platform: 'node',
  plugins: [Quansync()],
})
