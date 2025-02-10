import { createBirpc, type BirpcReturn } from 'birpc'
import type { MainFunctions } from '../rpc.ts'
import type { MessagePort } from 'node:worker_threads'

const threadFunctions = {}
export type ThreadFunctions = typeof threadFunctions

// eslint-disable-next-line import/no-mutable-exports
export let rpc: BirpcReturn<MainFunctions, ThreadFunctions>

export function initRpc(port: MessagePort): void {
  rpc = createBirpc(threadFunctions, {
    post: (data) => port.postMessage(data),
    on: (fn) => port.on('message', fn),
  })
}

export function log(...args: any[]): Promise<void> {
  return rpc.log(...args)
}
