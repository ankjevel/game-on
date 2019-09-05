import { wait } from '../utils'
import { lock, unlock } from './lock'
import { popSession } from './session'

export const messageListener = (
  channel: string,
  onMessage: (message: string) => Promise<void>
) =>
  setImmediate(async () => {
    let message: string | null

    try {
      message = await popSession(channel)
    } catch (error) {
      console.error(error)
      return process.exit(0)
    }

    if (!message) {
      await wait(1000)
      return messageListener(channel, onMessage)
    }

    while (!(await lock(channel))) {
      await wait(100)
    }

    await onMessage(message)
    await unlock(channel)

    return messageListener(channel, onMessage)
  })

export default messageListener
