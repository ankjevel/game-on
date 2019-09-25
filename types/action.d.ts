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
  start: number
  userID: User['id']
  group: Group
  action: ActionRunning
  nextIndex: (current: number) => number
  check?: (value: NewActionEnum) => Boolean
}

export type Share = {
  id: User['id']
  sum: number
}

export interface ActionRunningWithSidePot extends ActionRunning {
  sidePot: NonNullable<ActionRunning['sidePot']>
}
