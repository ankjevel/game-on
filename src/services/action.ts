import {
  UserWithOutPassword,
  Action,
  Group,
  NewActionEnum,
  ActionRunning,
  NewAction,
  UserSummary,
  User,
} from 'dataStore'

import {
  Message,
  ActionGroup,
  QueryNext,
  Share,
  ActionRunningWithSidePot,
} from 'action'

import * as dataStore from './dataStore'
import { pushSession } from './session'
import { parse, hasProp, clone, debug } from '../utils'
import mainLoop from './messageListener'
import { newDeck, takeCards } from './cards'

const CHANNEL = 'message'

const isMessage = (input: Message | any): input is Message =>
  input != null &&
  (hasProp<any>(input, 'actionID') &&
    dataStore.checkId(input.actionID, 'action:running')) &&
  (hasProp<any>(input, 'groupID') &&
    dataStore.checkId(input.groupID, 'group')) &&
  (hasProp<any>(input, 'userID') && dataStore.checkId(input.userID, 'user')) &&
  (hasProp<any>(input, 'newAction') && dataStore.isNewAction(input.newAction))

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
  const action = await dataStore.getWrapper<ActionRunning>({
    id: actionID,
    type: 'action:running',
  })

  const group = await dataStore.getWrapper<Group>({
    id: groupID,
    type: 'group',
  })

  if (
    action == null ||
    group == null ||
    group.users.some(user => user.id === userID) === false ||
    group.action !== action.id ||
    (action.round === 4 &&
      group.owner !== userID &&
      (newAction.type !== 'winner' && newAction.type !== 'draw'))
  ) {
    return
  }

  await push({ actionID, userID, groupID, newAction })
}

const applyAction = (userAction: NewActionEnum, action: ActionRunning) =>
  action.round === 0 && (userAction === 'call' || userAction === 'check')
    ? 'bet'
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
      check == null ? status !== 'fold' && status !== 'allIn' : check(status)
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
    newAction.type === 'none' && action.queued[userID]
      ? action.queued[userID]
      : newAction
  const userIndex = group.users.findIndex(({ id }) => id === userID)
  const user = group.users[userIndex] as Group['users'][0]
  const player = action.turn[userID]
  const currentStatus = clone(player.status)
  const playerAnte = player.bet
  const turns = Object.values(action.turn)
  const round = action.round

  debug.action({ action, group, newAction, userID })

  if (!player) {
    console.info(action.id, `missing player ${userID}`)
    return
  }

  const playersLeft = Object.entries(action.turn).filter(
    ([, status]) => status.status !== 'fold' && status.status !== 'allIn'
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
    case 'none': {
      console.info(action.id, 'no stored actions')
      return
    }

    case 'bet': {
      if (player.status !== 'none') {
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

      player.status = 'bet'
      break
    }

    case 'call': {
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

      player.status = applyAction('call', action)
      break
    }

    case 'raise': {
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
      player.status = applyAction('raise', action)
      break
    }

    case 'fold': {
      if (
        // edge case, where small blind folds in betting round
        action.round === 0 &&
        action.small === userID &&
        player.status === 'none'
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
          check: type => ['bet', 'call', 'check'].includes(type),
        })

        console.info(action.id, 'handle edgecase where BIG folds')
        if (nextUserIndex == null || group.users[nextUserIndex] == null) {
          console.info(action.id, 'cant find NEXT better, maybe dont fold?')
          return
        } else {
          action.big = group.users[nextUserIndex].id
        }
      }

      player.status = 'fold'
      break
    }

    case 'check': {
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

      player.status = applyAction('check', action)
      break
    }

    case 'allIn': {
      const bet = player.bet + user.sum

      player.bet = bet
      action.pot += user.sum
      player.status = 'allIn'
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
    turns.every(turn => turn.status !== 'none')

    if (
      turns.every(turn => turn.status !== 'none') &&
      turns
        .filter(turn => turn.status !== 'allIn' && turn.status !== 'fold')
        .every((turn, i, array) =>
          array[i - 1] ? array[i - 1].bet === turn.bet : true
        )
    ) {
      ++action.round
      action.button = action.big

      turns
        .filter(turn => turn.status !== 'allIn' && turn.status !== 'fold')
        .forEach(turn => {
          turn.status = 'bet'
        })

      console.info(action.id, 'should end betting round')
    }
  } else if (
    userAction.type !== 'raise' &&
    (userAction.type !== 'allIn' && action.big !== userID) &&
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
    currentStatus === 'none' &&
    // edge case where small folds at beginning of game
    player.status !== 'fold' &&
    action.big !== userID
  ) {
    console.info(action.id, 'set BIG <- SMALL')
    action.big = userID
  }

  maybeEnd: if (
    turns.filter(x => x.status !== 'fold' && x.status !== 'allIn').length <= 1
  ) {
    if (turns.filter(x => x.status === 'allIn').length >= 1) {
      if (turns.filter(x => x.status === 'none').length >= 1) {
        break maybeEnd
      }
      action.round = 4
      console.info(action.id, 'showdown; contains all-in')
      break maybeEnd
    }

    console.info(action.id, `showdown; winner ${action.big}`)
    await handleEndRound(action, group, {
      type: 'winner',
      order: [[action.big]],
    })
    debug.endAction({ action, group })
    return
  }

  debug.endAction({ action, group })

  if (round !== action.round) {
    maybeDealCards(action, group, round)
  }

  await dataStore.update(action.id, action, 'action:running')
  await dataStore.update(group.id, group, 'group')
}

const dealCards = (
  order: User['id'][],
  action: ActionRunning,
  round: number
) => {
  switch (round) {
    case 1: {
      for (const id of order) {
        const user = action.turn[id] as { cards: string[] }
        user.cards = takeCards(action.deck, 1) as [string]
      }

      for (const id of order) {
        const user = action.turn[id] as { cards: string[] }
        user.cards.push(...(takeCards(action.deck, 1) as [string]))
      }

      break
    }

    case 4:
    case 3: {
      action.communityCards.push(
        ...(takeCards(action.deck, 2) as [string, string]).slice(-1)
      )
      break
    }

    case 2: {
      action.communityCards.push(
        ...(takeCards(action.deck, 4) as Tuple<string, 4>).slice(1, 4)
      )
      break
    }
  }
}

const maybeDealCards = (action: ActionRunning, group: Group, from: number) => {
  const size = group.users.length
  const buttonIndex = group.users.findIndex(user => user.id === action.button)
  const usersOrderedByButton = group.users.slice(0).map(({ id }) => id)
  usersOrderedByButton.splice(
    0,
    0,
    ...usersOrderedByButton.splice(buttonIndex, size - buttonIndex).slice(0)
  )

  for (const round of [...Array(action.round - from)]
    .map((_, ii) => action.round - (ii + 1) + 1)
    .reverse()) {
    dealCards(usersOrderedByButton, action, round)
  }
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

export const resetAction = async ({
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

      await dataStore.update(group.id, group, 'group')
      await dataStore.del({
        type: 'action:running',
        id: action.id,
      })

      console.log(action.id, 'game ended, winner declared', winner)
      return false
    }
  }

  const newSmall = group.users[indexOfSmall]
  const newBig = group.users[indexOfBig]

  const turn: ActionRunning['turn'] = {
    [newSmall.id]: { bet: group.blind.small, status: 'none' },
    [newBig.id]: { bet: group.blind.big, status: 'none' },
  }

  group.users
    .filter(
      ({ id, sum }) =>
        id !== newSmall.id && id !== newBig.id && sum > group.blind.big
    )
    .forEach(user => {
      turn[user.id] = { bet: 0, status: 'none' }
    })

  group.users[indexOfSmall].sum -= group.blind.small
  group.users[indexOfBig].sum -= group.blind.big

  action.big = newBig.id
  action.button = newSmall.id
  action.communityCards = []
  action.deck = newDeck()
  action.pot = pot + group.blind.small + group.blind.big
  action.queued = {}
  action.round = 0
  action.sidePot = undefined
  action.small = newSmall.id
  action.turn = turn
  group.users = group.users.filter(user => user.sum > group.blind.big)

  if (group.users.some(user => user.id === group.owner) === false) {
    group.owner = group.users[0].id
  }

  console.info('\n\n')
  console.info(action.id, 'new small:', newSmall, 'new big:', newBig)
  debug.endAction({ action, group })

  return true
}

const winners = (order: NonNullable<NewAction['order']>) =>
  order.reduce((sum, order) => sum + order.length, 0)

export const handleEndRoundWithSidePot = async (
  action: ActionRunningWithSidePot,
  group: Group,
  newAction: Message['newAction']
) => {
  const isDraw = newAction.type === 'draw'

  if (
    (newAction.order == null || Array.isArray(newAction.order) === false) &&
    !isDraw
  ) {
    console.info(action.id, 'ending without sharing sidepot is not allowed')
    return
  }

  let pot = clone(action.pot)
  let order = isDraw
    ? [action.sidePot.map(({ id }) => id)]
    : clone(newAction.order) || [[]]

  const share: Share[] = []
  action.sidePot.forEach(sidepot => {
    const first = order[0] || []

    if (first.find(id => id === sidepot.id) == null) {
      return
    }

    let mWinners = winners(order)
    first.forEach((id, index) => {
      if (id !== sidepot.id) {
        return
      }

      const sum = isDraw
        ? sidepot.sum
        : Math.floor(
            (sidepot.sum - (action.pot - pot)) * (mWinners / first.length)
          )

      share.push({ id: sidepot.id, sum })
      pot -= sum
      action.pot -= sum

      --mWinners
      first.splice(index, 1)
    })
  })

  order = order.filter(order => order.length)
  if (order.length) {
    const shared = winners(order)
    const sum = Math.floor(pot / shared)
    order.forEach(order =>
      order.forEach(id => {
        share.push({ id, sum })
      })
    )
    pot -= sum * shared
  }

  share.forEach(({ id, sum }) => {
    const user = group.users.find(user => user.id === id)

    if (user == null) {
      return
    }

    user.sum += sum
  })

  if (await resetAction({ action, pot, group })) {
    await dataStore.update(group.id, group, 'group')
    await dataStore.update(action.id, action, 'action:running')
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
    case 'draw': {
      const ids = Object.entries(action.turn)
        .filter(([, value]) => value.status !== 'fold')
        .map(([id]) => id)

      const share = Math.floor(action.pot / ids.length)

      ids.forEach(id => {
        const user = group.users.find(user => user.id === id) || { sum: 0 }
        user.sum += share
      })

      pot = action.pot - share * ids.length
      break
    }

    case 'winner': {
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
    await dataStore.update(group.id, group, 'group')
    await dataStore.update(action.id, action, 'action:running')
  }
}

mainLoop(CHANNEL, async maybeMessage => {
  const message = parse<Message>(maybeMessage)
  if (!isMessage(message)) {
    console.info('not valid message, discarding', message)
    return
  }

  const group = await dataStore.getWrapper<Group>({
    id: message.groupID,
    type: 'group',
  })

  const action = await dataStore.getWrapper<ActionRunning>({
    id: message.actionID,
    type: 'action:running',
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
      (message.newAction.type === 'draw' || message.newAction.type === 'winner')
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

    return await dataStore.update(action.id, action, 'action:running')
  }

  return handleUpdate(action, group, message)
})
