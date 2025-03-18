// @ts-check
require('../dist/index.js').registerSync()

// @ts-expect-error
require('./prefix_trace')

// @ts-expect-error
const virtualMod = require('virtual-mod')
console.info(virtualMod)
