// import uuid from 'uuid'

// import redis from '../adapters/redis'
import { Group, StoreTypes, isGroup } from '../types/dataStore'
import { get as getFromStore } from './dataStore'
import { pushSession } from './session'
import parse from '../utils/parse'
import mainLoop from './messageListener'

const CHANNEL = 'message'

// const client = redis()

const getGroup = async (id: Group['id']): Promise<Group | null> => {
  const result = await getFromStore({ id, type: StoreTypes.Group })

  return isGroup(result) ? result : null
}

export const queueAction = async (group: Group | null) => {
  if (group == null) {
    throw new Error('wrong input')
  }

  const fromDB = await getGroup(group.id)

  if (fromDB == null) {
    throw new Error('missing data')
  }

  if (group.action == null && fromDB.action == null) {
    // no action has been made
  }

  if (group.action == null && fromDB.action != null) {
    // client is not updated
  }

  if (group.action != null && fromDB.action == null) {
    // server has not been updated
  }

  if (group.action != null && fromDB.action != null) {
    // handle diff
  }
}

export const push = async (message: any) => {
  await pushSession({ channel: CHANNEL, message: JSON.stringify(message) })
}
;(async () => {
  mainLoop(CHANNEL, async message => {
    console.log(parse(message))
  })
})()
