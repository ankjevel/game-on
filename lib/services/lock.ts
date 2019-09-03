import uuid from 'uuid'

import { lockExpire } from '../config'
import redis from '../adapters/redis'

const sessionId = uuid.v4()
const client = redis()

export const lock = async (
  key: string,
  expire = lockExpire
): Promise<boolean> => {
  const lockKey = `lock:${key}`
  const ok = await client.setnx(lockKey, sessionId)

  const lockSet = ok === 1

  if (lockSet && expire > 0) {
    await client.expire(lockKey, expire)
  }

  return lockSet
}

export const unlock = async (key: string) => {
  await client.del(`lock:${key}`)
}
