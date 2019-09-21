import { UserWithOutPassword, Action, Group, User } from 'dataStore'
import {
  StoreTypes as Type,
  ActionRunning,
  NewAction,
  checkId,
  isNewAction,
  NewActionEnum as NAE,
  NewActionEnum,
  UserSummary,
} from '../types/dataStore'
import { Message } from '../types/action'
import { getWrapper as getFromStore, update, del } from './dataStore'
import { pushSession } from './session'
import { parse, hasProp, clone, debug } from '../utils'
import mainLoop from './messageListener'

type QueryNext = {
  start: number
  userID: User['id']
  group: Group
  action: ActionRunning
  nextIndex: (current: number) => number
  check?: (value: NAE) => Boolean
}

type Share = {
  id: User['id']
  sum: number
}

const CHANNEL = 'message'

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
    group.action !== action.id ||
    (action.round === 4 &&
      group.owner !== userID &&
      (newAction.type !== NAE.Winner && newAction.type !== NAE.Draw))
  ) {
    return
  }

  await push({ actionID, userID, groupID, newAction })
}

const applyAction = (userAction: NAE, action: ActionRunning) =>
  action.round === 0 && (userAction === NAE.Call || userAction === NAE.Check)
    ? NAE.Bet
    : userAction

const getPlayer = ({
  start,
  group,
  action,
  userID,
  nextIndex,
  check,
}: QueryNext) => {
  const max = group.users.length
  let i = 0
  let run = true
  let nextUserIndex: MaybeNull<number> = start

  do {
    if (++i >= max) {
      console.info(action.id, 'cant find next player')
      run = false
      nextUserIndex = null
      break
    }

    nextUserIndex = nextIndex(nextUserIndex)

    const user = group.users[nextUserIndex]
    if (
      user == null ||
      user.id == null ||
      action.turn[user.id] == null ||
      userID === user.id
    ) {
      continue
    }

    const { status } = action.turn[user.id]
    if (
      check == null
        ? status !== NAE.Fold && status !== NAE.AllIn
        : check(status)
    ) {
      run = false
      break // found user
    }
  } while (run)

  return nextUserIndex
}

const raisePot = ({
  raise = 0,
  currentAnte,
  playerAnte,
  user,
  action,
  player,
}: {
  raise?: number
  currentAnte: number
  playerAnte: number
  user: Group['users'][0]
  action: ActionRunning
  player: UserSummary
}) => {
  const sum = currentAnte - playerAnte + raise
  if (user.sum <= sum) {
    console.info(action.id, 'cant update, not enough funds (maybe all-in?)')
    return false
  }

  user.sum -= sum
  player.bet += sum
  action.pot += sum

  return true
}

const handleUpdate = async (
  action: ActionRunning,
  group: Group,
  { newAction, userID }: Message
) => {
  const currentBig = clone(action.big)
  const isBig = userID === currentBig
  const currentAnte = action.turn[action.big].bet
  const userAction =
    newAction.type === NAE.None && action.queued[userID]
      ? action.queued[userID]
      : newAction
  const userIndex = group.users.findIndex(({ id }) => id === userID)
  const user = group.users[userIndex] as Group['users'][0]
  const player = action.turn[userID]
  const currentStatus = clone(player.status)
  const playerAnte = player.bet
  const turns = Object.values(action.turn)

  debug.action({ action, group, newAction, userID })

  if (!player) {
    console.info(action.id, `missing player ${userID}`)
    return
  }

  const playersLeft = Object.entries(action.turn).filter(
    ([, status]) => status.status !== NAE.Fold && status.status !== NAE.AllIn
  )

  const lastPlayerButNeedToRaise =
    playersLeft.length === 1 &&
    playersLeft[0][0] === userID &&
    playersLeft[0][1].bet !== currentAnte

  const nextUserIndex = lastPlayerButNeedToRaise
    ? userIndex
    : getPlayer({
        start: userIndex,
        userID,
        group,
        action,
        nextIndex: current => (current + 1) % group.users.length,
      })

  switch (userAction.type) {
    case NAE.None: {
      console.info(action.id, 'no stored actions')
      return
    }

    case NAE.Bet: {
      if (player.status !== NAE.None) {
        console.info(action.id, 'bet is only used in start of round')
        return
      }

      if (
        !raisePot({
          currentAnte,
          playerAnte,
          user,
          action,
          player,
        })
      ) {
        return
      }

      player.status = NAE.Bet
      break
    }

    case NAE.Call: {
      if (
        !raisePot({
          currentAnte,
          playerAnte,
          user,
          action,
          player,
        })
      ) {
        return
      }

      player.status = applyAction(NAE.Call, action)
      break
    }

    case NAE.Raise: {
      if (userAction.value == null) {
        console.info(action.id, 'nothing raised')
        return
      }

      if (
        !raisePot({
          raise: userAction.value,
          currentAnte,
          playerAnte,
          user,
          action,
          player,
        })
      ) {
        return
      }

      action.big = userID
      player.status = applyAction(NAE.Raise, action)
      break
    }

    case NAE.Fold: {
      if (
        // edge case, where small blind folds in betting round
        action.round === 0 &&
        action.small === userID &&
        player.status === NAE.None
      ) {
        if (nextUserIndex == null || group.users[nextUserIndex] == null) {
          console.info(action.id, 'cant fold if no one else is in game :(')
          return
        }
        console.info(action.id, 'why you do this? folding')
        action.big = group.users[nextUserIndex].id
      }

      if (action.big === userID) {
        const nextUserIndex = getPlayer({
          start: userIndex,
          userID,
          group,
          action,
          nextIndex: current => (current + 1) % group.users.length,
          check: type => [NAE.Bet, NAE.Call, NAE.Check].includes(type),
        })

        console.info(action.id, 'handle edgecase where BIG folds')
        if (nextUserIndex == null || group.users[nextUserIndex] == null) {
          console.info(action.id, 'cant find NEXT better, maybe dont fold?')
          return
        } else {
          action.big = group.users[nextUserIndex].id
        }
      }

      player.status = NAE.Fold
      break
    }

    case NAE.Check: {
      if (!isBig) {
        const previousUserIndex = getPlayer({
          start: userIndex,
          userID,
          group,
          action,
          nextIndex: current => {
            --current

            if (current === -1) {
              current = group.users.length - 1
            }

            return current
          },
        })

        if (previousUserIndex == null) {
          console.info(action.id, 'cant find previous user')
          return
        }

        const prev = action.turn[group.users[previousUserIndex].id]

        if (prev.bet !== player.bet) {
          console.info(action.id, 'cant check, must raise (also not big)')
          return
        }
      }

      player.status = applyAction(NAE.Check, action)
      break
    }

    case NAE.AllIn: {
      const bet = player.bet + user.sum

      player.bet = bet
      action.pot += user.sum
      player.status = NAE.AllIn
      user.sum = 0

      if (action.sidePot == null) {
        action.sidePot = []
      }

      action.sidePot.push({
        id: userID,
        sum: bet,
      })

      break
    }

    default:
      console.info(action.id, `unhandled event: ${userAction.type}`)
      return
  }

  if (nextUserIndex == null || group.users[nextUserIndex] == null) {
    console.info(action.id, 'missing next player')
    return
  }

  const nextUserID = group.users[nextUserIndex].id
  console.info(action.id, `new button: ${action.button} => ${nextUserID}`)
  action.button = nextUserID

  if (action.round === 0) {
    turns.every(turn => turn.status !== NAE.None)

    if (
      turns.every(turn => turn.status !== NAE.None) &&
      turns
        .filter(turn => turn.status !== NAE.AllIn && turn.status !== NAE.Fold)
        .every((turn, i, array) =>
          array[i - 1] ? array[i - 1].bet === turn.bet : true
        )
    ) {
      action.round += 1
      action.button = action.big

      turns
        .filter(turn => turn.status !== NAE.AllIn && turn.status !== NAE.Fold)
        .forEach(turn => {
          turn.status = NAE.Bet
        })

      console.info(action.id, 'should end betting round')
    }
  } else if (
    userAction.type !== NAE.Raise &&
    (userAction.type !== NAE.AllIn && action.big !== userID) &&
    nextUserID === currentBig
  ) {
    ++action.round
    if (action.round === 4) {
      console.info(action.id, 'showdown!\n\n')
    } else {
      console.info(action.id, 'new round\n\n')
    }
  }

  if (action.queued[userID]) {
    delete action.queued[userID]
  }

  if (
    // again, small becomes the big in first round
    action.round === 0 &&
    action.small === userID &&
    currentStatus === NAE.None &&
    // edge case where small folds at beginning of game
    player.status !== NAE.Fold &&
    action.big !== userID
  ) {
    console.info(action.id, 'set BIG <- SMALL')
    action.big = userID
  }

  maybeEnd: if (
    turns.filter(x => x.status !== NAE.Fold && x.status !== NAE.AllIn).length <=
    1
  ) {
    if (turns.filter(x => x.status === NAE.AllIn).length >= 1) {
      if (turns.filter(x => x.status === NAE.None).length >= 1) {
        break maybeEnd
      }
      action.round = 4
      console.info(action.id, 'showdown; contains all-in')
      break maybeEnd
    }

    console.info(action.id, `showdown; winner ${action.big}`)
    await handleEndRound(action, group, {
      type: NAE.Winner,
      winners: [action.big],
    })
    debug.endAction({ action, group })
    return
  }

  debug.endAction({ action, group })

  await update(action.id, action, Type.ActionRunning)
  await update(group.id, group, Type.Group)
}

type ActionGroup = {
  action: ActionRunning
  group: Group
}

const findNext = (group: Group, startIndex: number, sum: number, tries = 0) => {
  const max = group.users.length

  if (tries > max) {
    return -1
  }

  const next = (startIndex + 1) % max

  if (group.users[next].sum < sum) {
    console.info(`cant use user ${next}`)
    return findNext(group, next, sum, ++tries)
  }

  return next
}

const resetAction = async ({
  action,
  group,
  pot = 0,
}: ActionGroup & {
  pot?: ActionRunning['pot']
}) => {
  const indexOfOldSmall = group.users.findIndex(
    user => user.id === action.small
  )

  const indexOfSmall = findNext(group, indexOfOldSmall, group.blind.small)
  const indexOfBig = findNext(group, indexOfSmall, group.blind.big)

  if (indexOfBig === -1 || indexOfSmall === -1) {
    console.info(
      action.id,
      `cant find next big|small [${indexOfBig},${indexOfSmall}]`
    )
    return false
  }

  if (indexOfBig === indexOfSmall) {
    if (
      group.users.filter(
        (user, i) => i !== indexOfBig && user.sum > group.blind.big
      ).length < 1
    ) {
      const winner = [group.users[indexOfBig]]
      group.users = winner
      group.action = undefined

      await update(group.id, group, Type.Group)
      await del({
        type: Type.ActionRunning,
        id: action.id,
      })

      console.log(action.id, 'game ended, winner declared', winner)
      return false
    }
  }

  const newSmall = group.users[indexOfSmall]
  const newBig = group.users[indexOfBig]

  const turn = {
    [newSmall.id]: { bet: group.blind.small, status: NAE.None },
    [newBig.id]: { bet: group.blind.big, status: NAE.None },
  }

  group.users
    .filter(
      ({ id, sum }) =>
        id !== newSmall.id && id !== newBig.id && sum > group.blind.big
    )
    .forEach(user => {
      turn[user.id] = {
        bet: 0,
        status: NAE.None,
      }
    })

  group.users[indexOfSmall].sum -= group.blind.small
  group.users[indexOfBig].sum -= group.blind.big

  group.users = group.users.filter(user => user.sum > group.blind.big)
  action.pot = pot + group.blind.small + group.blind.big
  action.round = 0
  action.turn = turn
  action.sidePot = undefined
  action.button = newSmall.id
  action.queued = {}
  action.big = newBig.id
  action.small = newSmall.id

  if (group.users.some(user => user.id === group.owner) === false) {
    group.owner = group.users[0].id
  }

  console.info('\n\n')
  console.info(action.id, 'new small:', newSmall, 'new big:', newBig)
  debug.endAction({ action, group })

  return true
}

interface ActionRunningWithSidePot extends ActionRunning {
  sidePot: NonNullable<ActionRunning['sidePot']>
}

const handleEndRoundWithSidePot = async (
  action: ActionRunningWithSidePot,
  group: Group,
  newAction: Message['newAction']
) => {
  if (newAction.winners == null || Array.isArray(newAction.winners) === false) {
    console.info(action.id, 'ending without sharing sidepot is now allowed')
    return
  }

  let pot = clone(action.pot)
  let winners = clone(newAction.winners)

  const share: Share[] = []

  action.sidePot.forEach(sidepot => {
    const wonSidePot = sidepot.id === winners[0]
    if (wonSidePot) {
      const won = Math.floor(
        (sidepot.sum - (action.pot - pot)) * winners.length
      )
      share.push({
        id: sidepot.id,
        sum: won,
      })
      pot -= won
    }
    winners = winners.filter(id => id !== sidepot.id)
  })

  if (winners.length) {
    const sum = Math.floor(pot / winners.length)
    winners.forEach(id => {
      share.push({ id, sum })
    })
    pot -= sum * winners.length
  }

  share.forEach(({ id, sum }) => {
    const user = group.users.find(user => user.id === id)
    if (user == null) {
      return
    }
    user.sum += sum
  })

  if (await resetAction({ action, pot, group })) {
    await update(group.id, group, Type.Group)
    await update(action.id, action, Type.ActionRunning)
  }
}

const handleEndRound = async (
  action: ActionRunning,
  group: Group,
  newAction: Message['newAction']
) => {
  if (action.sidePot != null) {
    return handleEndRoundWithSidePot(
      action as ActionRunningWithSidePot,
      group,
      newAction
    )
  }

  let pot = 0
  switch (newAction.type) {
    case NAE.Draw: {
      const ids = Object.entries(action.turn)
        .filter(([, value]) => value.status !== NAE.Fold)
        .map(([id]) => id)

      const share = Math.floor(action.pot / ids.length)

      ids.forEach(id => {
        const user = group.users.find(user => user.id === id) || { sum: 0 }
        user.sum += share
      })

      pot = action.pot - share * ids.length
      break
    }

    case NAE.Winner: {
      const user = group.users.find(user => user.id === action.big) || {
        sum: 0,
      }
      user.sum += action.pot
      break
    }

    default:
      console.info(action.id, 'unhandled event', newAction)
      return
  }

  if (await resetAction({ action, pot, group })) {
    await update(group.id, group, Type.Group)
    await update(action.id, action, Type.ActionRunning)
  }
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
    console.info(action.id, `wrong group: ${action.groupID} !== ${group.id}`)
    return
  }

  if (action.round === 4) {
    if (
      group.owner === message.userID &&
      (message.newAction.type === NewActionEnum.Draw ||
        message.newAction.type === NewActionEnum.Winner)
    ) {
      return handleEndRound(action, group, message.newAction)
    }

    console.info(action.id, 'group is in showdown')
    return
  }

  if (message.userID !== action.button) {
    action.queued[message.userID] = message.newAction

    console.info(
      action.id,
      `storing action ${message.newAction.type} for user ${message.userID}`
    )

    return await update(action.id, action, Type.ActionRunning)
  }

  return handleUpdate(action, group, message)
})
