import { Buffer } from 'node:buffer'
import type { SourceMap } from '@jridgewell/remapping'

export function attachSourceMap(map: SourceMap, code: string): string {
  if (map) {
    if (!map.sourcesContent || map.sourcesContent.length === 0)
      map.sourcesContent = [code]
    code += `\n//# sourceMappingURL=${toUrl(map)}`
  }
  return code
}

function toUrl(map: SourceMap) {
  return `data:application/json;charset=utf-8;base64,${Buffer.from(map.toString()).toString('base64')}`
}
