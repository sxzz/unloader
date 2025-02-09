import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: 'esm',
  target: 'node18.19',
  clean: true,
  dts: { transformer: 'oxc' },
  platform: 'node',
})
