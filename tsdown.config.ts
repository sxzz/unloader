import { defineConfig } from 'tsdown'
import Quansync from 'unplugin-quansync/rolldown'

export default defineConfig({
  entry: ['./src/{index,register,register-sync,worker}.ts'],
  target: 'node18.19',
  clean: true,
  dts: true,
  platform: 'node',
  plugins: [
    Quansync({
      exclude: ['**/*.d.ts'],
    }),
  ],
})
