import { data } from './index.ts'
import type { TransferListItem } from 'node:worker_threads'

export interface MessageLog {
  type: 'log'
  message: any
}

function sendMessage(message: MessageLog, transferList?: TransferListItem[]) {
  data.port.postMessage(message, transferList)
}

export function log(message: any, transferList?: TransferListItem[]): void {
  sendMessage({ type: 'log', message }, transferList)
}
