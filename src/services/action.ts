import { UserWithOutPassword, Action, Group, User } from 'dataStore'
import {
  StoreTypes as Type,
  ActionRunning,
  NewAction,
  checkId,
  isNewAction,
} from '../types/dataStore'
import { getWrapper as getFromStore, update } from './dataStore'
import { pushSession } from './session'
import { parse, hasProp } from '../utils'
import mainLoop from './messageListener'

const CHANNEL = 'message'

type Message = {
  actionID: ActionRunning['id']
  groupID: Group['id']
  userID: User['id']
  newAction: NewAction
}

const isMessage = (input: Message | any): input is Message =>
  input != null &&
  (hasProp<any>(input, 'actionID') &&
    checkId(input.actionID, Type.ActionRunning)) &&
  (hasProp<any>(input, 'groupID') && checkId(input.groupID, Type.Group)) &&
  (hasProp<any>(input, 'userID') && checkId(input.userID, Type.User)) &&
  (hasProp<any>(input, 'newAction') && isNewAction(input.newAction))

const push = async (message: Message) => {
  if (!isMessage(message)) {
    return
  }

  await pushSession({ channel: CHANNEL, message: JSON.stringify(message) })
}

export const newAction = async ({
  actionID,
  groupID,
  userID,
  newAction,
}: {
  actionID: Action['id']
  groupID: Group['id']
  userID: UserWithOutPassword['id']
  newAction: NewAction
}) => {
  const action = await getFromStore<ActionRunning>({
    id: actionID,
    type: Type.ActionRunning,
  })

  const group = await getFromStore<Group>({
    id: groupID,
    type: Type.Group,
  })

  if (
    action == null ||
    group == null ||
    group.users.some(user => user.id === userID) === false ||
    group.action !== action.id
  ) {
    return
  }

  await push({ actionID, userID, groupID, newAction })
}

mainLoop(CHANNEL, async maybeMessage => {
  const message = parse<Message>(maybeMessage)
  if (!isMessage(message)) {
    console.info('not valid message, discarding', message)
    return
  }

  const group = await getFromStore<Group>({
    id: message.groupID,
    type: Type.Group,
  })

  const action = await getFromStore<ActionRunning>({
    id: message.actionID,
    type: Type.ActionRunning,
  })

  if (group == null) {
    console.info(`missing group/action: ${message.groupID}`)
    return
  }

  if (action == null) {
    console.info(`missing action: ${message.actionID}`)
    return
  }

  if (action.groupID !== group.id) {
    console.log(`[${action.id}] wrong group: ${action.groupID} !== ${group.id}`)
    return
  }

  if (message.userID !== action.button) {
    action.queued[message.userID] = message.newAction
    await update(action.id, action, Type.ActionRunning)
    return
  }

  console.log(action, group, message.newAction)
})
