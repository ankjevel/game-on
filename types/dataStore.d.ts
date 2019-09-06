export interface Action {
  id: string
}

export interface ITurn<T> {
  [userID: string]: T
}

export interface IActionRunning<T> extends Action {
  round: 0 | 1 | 2 | 3
  grupID: Group['id']
  queued: ITurn<T>
  turn: ITurn<T>[]
  button: User['id']
  big: User['id']
  pot: number

  folded: User['id'][]

  sittingOut?: User['id'][]
  history?: ITurn<T>[]
  bust?: User['id'][]
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
