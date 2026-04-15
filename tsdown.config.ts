import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/{index,register}.ts',
  exports: true,
  deps: { onlyBundle: ['@antfu/utils'] },
})
