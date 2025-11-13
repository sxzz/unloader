import { createBirpc, type BirpcReturn } from 'birpc'
import { debug } from './utils/debug'
import type { ThreadFunctions } from './worker'
import type { MessagePort } from 'node:worker_threads'

const mainFunctions = {
  log(...messages: any[]): void {
    console.info(...messages)
  },
  debug(...args: any[]): void {
    ;(debug as any)(...args)
  },
}
export type MainFunctions = typeof mainFunctions

export function createRpc(
  port: MessagePort,
): BirpcReturn<ThreadFunctions, MainFunctions> {
  const rpc = createBirpc<ThreadFunctions, MainFunctions>(mainFunctions, {
    post: (data) => port.postMessage(data),
    on: (fn) => port.on('message', fn),
  })

  return rpc
}
