import { UserWithOutPassword, Action, Group, User } from 'dataStore'
import {
  StoreTypes as Type,
  ActionRunning,
  NewAction,
  checkId,
  isNewAction,
  NewActionEnum as NAE,
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

const handleUpdate = async (
  action: ActionRunning,
  group: Group,
  { newAction, userID }: Message
) => {
  const isBig = userID === action.big
  const currentAnte = action.turn[action.big].bet

  const userAction =
    newAction.type === NAE.None && action.queued[userID]
      ? action.queued[userID]
      : newAction

  const userIndex = group.users.findIndex(({ id }) => id === userID)
  const user = group.users[userIndex] as Group['users'][0]
  const player = action.turn[userID]
  const playerAnte = player.bet

  const raisePot = (raise = 0) => {
    const sum = currentAnte - playerAnte + raise
    if (user.sum < sum) {
      console.log('cant update, not enough funds')
      return false
    }

    user.sum -= sum
    player.bet += sum
    action.pot += sum

    return true
  }

  switch (userAction.type) {
    case NAE.None: {
      console.log('no stored actions')
      return
    }
    case NAE.Call: {
      if (!raisePot()) {
        return
      }

      player.status = NAE.Call
      break
    }
    case NAE.Raise: {
      if (userAction.value == null) {
        console.log('nothing raised')
        return
      }

      if (!raisePot(userAction.value)) {
        return
      }

      player.status = NAE.Raise
      break
    }
    case NAE.AllIn:
    case NAE.Fold:
      break
    case NAE.Check: {
      if (!isBig) {
        console.log('cant check, not "leader"')
        return
      }

      player.status = NAE.Check
      break
    }
    // case NAE.Back:
    // case NAE.Bank:
    // case NAE.Join:
    // case NAE.Leave:
    // case NAE.SittingOut:
  }

  let nextUserIndex = userIndex
  let i = 0
  const max = group.users.length
  let run = true
  do {
    if (++i >= max) {
      console.log('cant find next player')
      run = false
      return
    }

    nextUserIndex = (nextUserIndex + 1) % max

    const user = group.users[nextUserIndex]
    if (user == null || user.id == null || action.turn[user.id] == null) {
      continue
    }

    if (action.turn[user.id].status !== NAE.Fold) {
      run = false
      break
    }
  } while (run)

  action.button = group.users[nextUserIndex].id

  await update(action.id, action, Type.ActionRunning)
  await update(group.id, group, Type.Group)

  console.log(action, group)
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

  return handleUpdate(action, group, message)
})
