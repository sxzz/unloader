import { Buffer } from 'node:buffer'
import type { EncodedSourceMap, SourceMap } from '@ampproject/remapping'

export function attachSourceMap(map: any, code: string): string {
  if (map) {
    if (!map.sourcesContent || map.sourcesContent.length === 0)
      map.sourcesContent = [code]

    map = fixSourceMap(map as EncodedSourceMap)
    code += `\n//# sourceMappingURL=${map.toUrl()}`
  }
  return code
}

// `load` and `transform` may return a sourcemap without toString and toUrl,
// but esbuild needs them, we fix the two methods
export function fixSourceMap(map: EncodedSourceMap): SourceMap {
  if (!Object.prototype.hasOwnProperty.call(map, 'toString')) {
    Object.defineProperty(map, 'toString', {
      enumerable: false,
      value: function toString() {
        return JSON.stringify(this)
      },
    })
  }
  if (!Object.prototype.hasOwnProperty.call(map, 'toUrl')) {
    Object.defineProperty(map, 'toUrl', {
      enumerable: false,
      value: function toUrl() {
        return `data:application/json;charset=utf-8;base64,${Buffer.from(this.toString()).toString('base64')}`
      },
    })
  }
  return map as SourceMap
}
