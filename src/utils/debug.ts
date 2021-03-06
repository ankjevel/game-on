import { ActionRunning, Group } from 'dataStore'
import { Message } from 'action'

import { debug } from '../config'

export const fill = (char: string) => char.repeat(process.stdout.columns || 0)

export const action = ({
  action,
  group,
  newAction,
  userID,
}: {
  action: ActionRunning
  group: Group
  newAction: Message['newAction']
  userID: Message['userID']
}) => {
  if (!debug) {
    return
  }
  console.log(`\n\n${fill('-')}\n${fill('-')}`)
  console.log({
    userID,
    button: action.button,
    big: action.big,
    small: action.small,
    round: action.round,
    pot: action.pot,
    owner: group.owner,
    users: group.users.map(user => {
      const turn = action.turn[user.id]
      return Object.values({
        ...user,
        ...turn,
      })
    }),
    newAction,
  })
  console.log(`${fill('^')}\n\n`)
}

export const endAction = ({
  action,
  group,
}: {
  action: ActionRunning
  group: Group
}) => {
  if (!debug) {
    return
  }
  console.log('\n')
  console.log(fill('='))
  console.log(
    group.users.map(user => {
      const turn = action.turn[user.id]
      return Object.values({
        ...user,
        ...turn,
      })
    })
  )
  console.log(fill('='))
}

export default {
  action,
  fill,
  endAction,
}
