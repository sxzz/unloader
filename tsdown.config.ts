import { nodeLib } from 'tsdown-preset-sxzz'

export default nodeLib({
  entry: ['./src/{index,register}.ts'],
  inlineDeps: ['@antfu/utils'],
})
