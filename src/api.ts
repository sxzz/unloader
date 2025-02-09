import module from 'node:module'
import process from 'node:process'
import Debug from 'debug'
import type { Data } from './loader/index.ts'
import type { MessageLog } from './loader/rpc.ts'

const debug = Debug('unloader')

export function register(): void {
  if (!module.register) {
    throw new Error(
      `This version of Node.js (${process.version}) does not support module.register(). Please upgrade to Node v18.19 or v20.6 and above.`,
    )
  }

  const { port1, port2 } = new MessageChannel()
  const data: Data = {
    port: port2,
  }
  const transferList = [port2]
  module.register('./loader/index.js', {
    parentURL: import.meta.url,
    data,
    transferList,
  })

  port1.on('message', (message: MessageLog) => {
    switch (message.type) {
      case 'log': {
        if (message.debug) {
          debug(message.message)
        } else {
          console.info(message.message)
        }
      }
    }
  })
  port1.unref()
}
