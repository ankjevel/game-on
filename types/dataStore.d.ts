export interface Action {
  id: string
}
export interface IActionRunning<T> extends Action {
  queued: { [user: string]: T }[]
  next: User['id']
  last: User['id']
  grupID: Group['id']
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
  turn?: number
  action?: Action['id']
}

export type GetResult = null | User | Group | Action
