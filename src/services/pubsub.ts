import redis from '../adapters/redis'

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
  console.log(`published:${channel}`, message)
}
