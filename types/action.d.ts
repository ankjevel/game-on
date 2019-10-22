import { ActionRunning, Group, User, NewAction, NewActionEnum } from 'dataStore'

export type Message = {
  actionID: ActionRunning['id']
  groupID: Group['id']
  userID: User['id']
  newAction: NewAction
}

export type ActionGroup = {
  action: ActionRunning
  group: Group
}

export type QueryNext = {
  /**
   * index of current button
   */
  start: number
  /**
   * userID of current button
   */
  userID: User['id']
  group: Pick<Group, 'users' | 'id'>
  action: Pick<ActionRunning, 'turn'> & {
    id?: ActionRunning['id']
  }
  nextIndex: (current: number) => number
  check?: (value: NewActionEnum) => Boolean
}

export type Share = {
  id: User['id']
  sum: number
}

export interface ActionRunningWithSidePot extends ActionRunning {
  sidePot: NonNullable<ActionRunning['sidePot']>
  winners: NonNullable<ActionRunning['winners']>
}
