import { UserWithOutPassword, Action, Group, User } from 'dataStore'
import {
  StoreTypes as Type,
  NewAction,
  isAction,
  checkId,
  isNewAction,
} from '../types/dataStore'
import { getWrapper as getFromStore } from './dataStore'
import { pushSession } from './session'
import { parse, hasProp } from '../utils'
import mainLoop from './messageListener'

const CHANNEL = 'message'

type Message = {
  action: Action
  groupID: Group['id']
  newAction: {
    [userID: string]: NewAction
  }
}

const isMessage = (input: Message | any): input is Message => {
  return (
    input != null &&
    hasProp(input, 'action') &&
    isAction((input as any).action) &&
    hasProp(input, 'groupID') &&
    checkId((input as any).groupID, Type.Group) &&
    hasProp(input, 'newAction') &&
    checkId(Object.keys((input as any).newAction).pop() || '', Type.User) &&
    isNewAction(Object.values((input as any).newAction).pop())
  )
}

export const push = async (message: Message | any) => {
  if (!isMessage(message)) {
    return
  }

  await pushSession({ channel: CHANNEL, message: JSON.stringify(message) })
}

export const newAction = async ({
  id,
  groupID,
  userID,
  newAction,
}: {
  id: Action['id']
  groupID: Group['id']
  userID: UserWithOutPassword['id']
  newAction: NewAction
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

  await push({
    action,
    groupID: group.id,
    newAction: {
      [userID]: newAction,
    },
  })
}

mainLoop(CHANNEL, async message => {
  const parsed = parse<Message>(message)
  if (!isMessage(parsed)) {
    return
  }

  console.log('new message')
  console.log(parsed)
})
