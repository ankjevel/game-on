import redis from '../adapters/redis'

const client = redis()

export const pushSession = async ({
  channel,
  message,
}: {
  channel: string
  message: string
}) => {
  const key = `hold:${channel}`

  await client.lpush(key, message)
}

export const popSession = async (channel: string): Promise<string | null> => {
  const key = `hold:${channel}`
  const session = await client.rpop(key)

  return session
}

export const clear = async (channel: string): Promise<string[] | null> => {
  const key = `hold:${channel}`
  const sessions = await client.lrange(key, 0, -1)

  console.log('clear', { key, sessions })

  await client.del(key)
  return sessions
}
