import process from 'node:process'
import { createBirpc, type BirpcReturn } from 'birpc'
import Debug from 'debug'
import type { ThreadFunctions } from './loader/rpc'
import type { MessagePort } from 'node:worker_threads'

const debug = Debug('unloader')
const mainFunctions = {
  log(...messages: any[]): void {
    console.info(...messages)
  },
  debug(formatter: any, ...args: any[]): void {
    debug(formatter, ...args)
  },
  enableSourceMap(enabled: boolean): void {
    process.setSourceMapsEnabled(enabled)
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
