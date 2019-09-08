import redis from '../adapters/redis'
import { debug } from '../config'

const pub = redis()
export const subscribe = async (
  channel: string,
  onMessage: (message: any) => void
) => {
  const sub = redis()
  await sub.subscribe(channel)
  sub.on('message', event => {
    onMessage(event)
  })
}

export const publish = async (channel: string, message: string) => {
  await pub.publish(channel, message)
  console.info(`published:${channel}`, message)
}
