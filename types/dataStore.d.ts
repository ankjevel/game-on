export interface Action {
  id: string
}

export interface KeyValue<T> {
  [key: string]: T
}

export interface ActionRunning extends Action {
  /**
   * 0: betting round
   * 1-3: regular rounds
   * 4: showdown
   */
  round: 0 | 1 | 2 | 3 | 4
  groupID: Group['id']
  queued: KeyValue<NewAction>
  turn: KeyValue<UserSummary>
  button: User['id']
  big: User['id']
  small: User['id']
  pot: number
  sittingOut?: User['id'][]
  sidePot?: { id: User['id']; sum: number }[]
}

export interface User {
  id: string
  name: string
  password: string
}

export type UserWithOutPassword = Omit<User, 'password'>

export type JWTUSer = UserWithOutPassword & {
  iat: number
  exp: number
}

export interface Group {
  id: string
  name: string
  startSum: number
  owner: User['id']
  users: {
    id: User['id']
    sum: number
  }[]
  blind: {
    small: number
    big: number
  }
  action?: Action['id']
}

export type GetResult = null | User | Group | Action

export type Types = Action | Group | User

export type StoreTypes = 'action' | 'group' | 'user' | 'action:running'

export type NewActionEnum =
  | 'none'
  | 'bet'
  | 'check'
  | 'call'
  | 'raise'
  | 'allIn'
  | 'fold'
  | 'draw'
  | 'winner'
  | 'back'
  | 'bank'
  | 'join'
  | 'leave'
  | 'sittingOut'

export type NewAction = {
  type: NewActionEnum
  value?: number
  order?: User['id'][][]
}

export type UserSummary = {
  bet: number
  status: NewActionEnum
}

export type Check = <T>(result: T) => boolean

export type Order = { [order: string]: string }
