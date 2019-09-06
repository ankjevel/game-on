// import uuid from 'uuid'
// import redis from '../adapters/redis'
// const client = redis()

import { UserWithOutPassword, Action, Group, User } from 'dataStore'
import { StoreTypes as Type } from '../types/dataStore'
import { getWrapper as getFromStore } from './dataStore'
import { pushSession } from './session'
import { parse } from '../utils'
import mainLoop from './messageListener'

const CHANNEL = 'message'

const getGroup = async (id: Group['id']): Promise<MaybeNull<Group>> => {
  const result = await getFromStore<Group>({ id, type: Type.Group })

  if (result == null) {
    return null
  }

  return result
}

export const queueAction = async (group: MaybeNull<Group>) => {
  if (group == null) {
    throw new Error('wrong input')
  }

  const fromDB = await getGroup(group.id)

  if (fromDB == null) {
    throw new Error('missing data')
  }

  console.log(group, fromDB)
}

export const push = async (message: any) => {
  await pushSession({ channel: CHANNEL, message: JSON.stringify(message) })
}

export const newAction = async ({
  id,
  groupID,
  userID,
}: {
  id: Action['id']
  groupID: Group['id']
  userID: UserWithOutPassword['id']
}) => {
  const action = await getFromStore<Action>({ id, type: Type.Action })
  const group = await getFromStore<Group>({ id: groupID, type: Type.Group })
  if (
    action == null ||
    group == null ||
    group.users.some(user => user.id === userID) === false
  ) {
    return
  }

  console.log({ action, group, userID })
}

mainLoop(CHANNEL, async message => {
  console.log(parse(message))
})
