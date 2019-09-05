export interface Action {
  id: string
  lastAction?: string
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
  users: {
    id: User['id']
    sum: number
  }[]
  turn?: number
  action?: Action
}

export type GetResult = null | User | Group | Action
