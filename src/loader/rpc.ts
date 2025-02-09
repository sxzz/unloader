import { data } from './index.ts'
import type { TransferListItem } from 'node:worker_threads'

export interface MessageLog {
  type: 'log'
  debug?: boolean
  message: any
}

function sendMessage(message: MessageLog, transferList?: TransferListItem[]) {
  data.port.postMessage(message, transferList)
}

export function log(
  message: any,
  transferList?: TransferListItem[],
  debug?: boolean,
): void {
  sendMessage({ type: 'log', debug, message }, transferList)
}
