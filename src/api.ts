import module from 'node:module'
import process from 'node:process'
import { createRpc } from './rpc.ts'
import type { Data } from './loader/index.ts'

export function register(): void {
  if (!module.register) {
    throw new Error(
      `This version of Node.js (${process.version}) does not support module.register(). Please upgrade to Node v18.19 or v20.6 and above.`,
    )
  }

  const { port1, port2 } = new MessageChannel()
  createRpc(port1)
  port1.unref()

  const data: Data = { port: port2 }
  const transferList = [port2]
  module.register('./loader/index.js', {
    parentURL: import.meta.url,
    data,
    transferList,
  })
}
