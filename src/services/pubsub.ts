import redis from '../adapters/redis'

const pub = redis()

export const subscribe = async (
  channel = '*',
  onMessage: (message: { channel: string; message: string }) => void
) => {
  const sub = redis()

  await sub.psubscribe(channel)

  sub.on('pmessage', (_pattern, channel, message) =>
    onMessage({ channel, message })
  )

  return () => sub.punsubscribe(channel)
}

export const publish = async (channel: string, message: string) => {
  await pub.publish(channel, message)

  console.info(channel, message)
}
