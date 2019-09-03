import wait from '../utils/wait'
import { lock, unlock } from './lock'
import { popSession } from './session'

export const messageListener = (
  channel: string,
  onMessage: (message: string) => Promise<void>
) => {
  return setImmediate(async () => {
    const message = await popSession(channel)

    if (!message) {
      await wait(1000)
      return messageListener(channel, onMessage)
    }

    while (!(await lock(channel))) {
      await wait(100)
    }

    await onMessage(message)

    await wait(100)
    await unlock(channel)

    messageListener(channel, onMessage)
  })
}

export default messageListener
