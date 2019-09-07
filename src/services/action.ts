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

const playersLeft = (action: ActionRunning) =>
  Object.values(action.turn).filter(u => u.status !== NAE.Fold).length

const getNext = (start: number, group: Group, action: ActionRunning) => {
  const max = group.users.length
  let i = 0
  let run = true
  let nextUserIndex = start

  do {
    if (++i >= max) {
      console.log(action.id, 'cant find next player')
      run = false
      nextUserIndex = -1
      break
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

  return nextUserIndex
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
  let roundEnded = false

  const raisePot = (raise = 0) => {
    const sum = currentAnte - playerAnte + raise
    if (user.sum < sum) {
      console.log(action.id, 'cant update, not enough funds')
      return false
    }

    user.sum -= sum
    player.bet += sum
    action.pot += sum

    return true
  }

  switch (userAction.type) {
    case NAE.None: {
      console.log(action.id, 'no stored actions')
      return
    }

    case NAE.Bet: {
      if (player.status !== NAE.None) {
        console.log(action.id, 'bet is only used in start of round')
        return
      }

      if (!raisePot()) {
        return
      }

      player.status = NAE.Bet
      break
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
        console.log(action.id, 'nothing raised')
        return
      }

      if (!raisePot(userAction.value)) {
        return
      }

      action.big = userID
      player.status = NAE.Raise
      break
    }

    case NAE.Fold: {
      player.status = NAE.Fold
      break
    }

    case NAE.Check: {
      if (!isBig) {
        console.log(action.id, 'cant check, not "leader"')
        return
      }

      player.status = NAE.Check
      break
    }

    default:
      return

    // case NAE.AllIn:
    // case NAE.Back:
    // case NAE.Bank:
    // case NAE.Join:
    // case NAE.Leave:
    // case NAE.SittingOut:
  }

  let nextUserID: MaybeUndefined<User['id']>
  if (playersLeft(action) > 1) {
    const nextUserIndex = getNext(userIndex, group, action)

    if (nextUserIndex === -1) {
      console.log(action.id, 'missing next player')
      return
    }

    nextUserID = group.users[nextUserIndex].id

    if (
      nextUserID === action.big &&
      action.turn[nextUserID].status !== NAE.None
    ) {
      roundEnded = true
    } else {
      action.button = nextUserID
    }
  } else {
    const unFolded = Object.entries(action.turn).find(
      ([, value]) => value.status !== NAE.Fold
    )

    if (unFolded == null) {
      console.log(action.id, 'cant find winner :(')
      return
    }

    const [winnerID] = unFolded
    const winner = group.users.find(user => user.id === winnerID)

    if (winner == null) {
      console.log(action.id, 'winner not found :(')
      return
    }

    winner.sum = action.pot
    roundEnded = true
  }

  if (roundEnded) {
    console.log({ nextUserID })
    console.log(action.id, 'round ended')
    console.log(action, group)
  } else if (isBig && player.status !== NAE.Raise) {
    console.log(action.id, 'new big')
  }

  await update(action.id, action, Type.ActionRunning)
  await update(group.id, group, Type.Group)
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
    console.info(`missing group: ${message.groupID}`)
    return
  }

  if (action == null) {
    console.info(`missing action: ${message.actionID}`)
    return
  }

  if (action.groupID !== group.id) {
    console.log(action.id, `wrong group: ${action.groupID} !== ${group.id}`)
    return
  }

  if (message.userID !== action.button) {
    action.queued[message.userID] = message.newAction
    await update(action.id, action, Type.ActionRunning)
    return
  }

  return handleUpdate(action, group, message)
})
