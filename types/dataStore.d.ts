export interface Action {
  id: string
}

export interface KeyValue<T> {
  [key: string]: T
}

export interface IActionRunning<T, Y> extends Action {
  /**
   * 0: betting round
   * 1-3: regular rounds
   * 4: showdown
   */
  round: 0 | 1 | 2 | 3 | 4
  groupID: Group['id']
  queued: KeyValue<T>
  turn: KeyValue<Y>
  button: User['id']
  big: User['id']
  small: User['id']
  pot: number
  sittingOut?: User['id'][]
}

export interface User {
  id: string
  name: string
  email: string
  password: string
}

export type UserWithOutPassword = Omit<User, 'password'>

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
