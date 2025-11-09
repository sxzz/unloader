import { defineConfig } from 'tsdown'
import Quansync from 'unplugin-quansync/rolldown'

export default defineConfig({
  entry: './src/{index,register,register-sync,worker}.ts',
  plugins: [Quansync()],
  exports: true,
  inlineOnly: ['@antfu/utils'],
})
