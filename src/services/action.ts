import { UserWithOutPassword, Action, Group, User } from 'dataStore'
import {
  StoreTypes as Type,
  ActionRunning,
  NewAction,
  checkId,
  isNewAction,
  isActionRunning,
} from '../types/dataStore'
import { getWrapper as getFromStore } from './dataStore'
import { pushSession } from './session'
import { parse, hasProp } from '../utils'
import mainLoop from './messageListener'

const CHANNEL = 'message'

type Message = {
  action: ActionRunning
  userID: User['id']
  newAction: NewAction
}

const isMessage = (input: Message | any): input is Message => {
  return (
    input != null &&
    (hasProp(input, 'action') && isActionRunning((input as any).action)) &&
    (hasProp(input, 'userID') && checkId((input as any).userID, Type.User)) &&
    (hasProp(input, 'newAction') && isNewAction((input as any).newAction))
  )
}

export const push = async (message: Message) => {
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
  const action = await getFromStore<ActionRunning>({ id, type: Type.Action })
  const group = await getFromStore<Group>({ id: groupID, type: Type.Group })
  if (
    action == null ||
    group == null ||
    group.users.some(user => user.id === userID) === false
  ) {
    return
  }

  console.log('this', { action, userID, newAction })

  await push({ action, userID, newAction })
}

mainLoop(CHANNEL, async message => {
  const parsed = parse<Message>(message)
  if (!isMessage(parsed)) {
    return
  }

  console.log('new message')
  console.log(parsed)
})
