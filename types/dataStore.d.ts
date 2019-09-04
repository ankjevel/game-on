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
  users: User[]
  action?: Action
}

export type CreateGroupInput = {
  name?: string
  startSum?: number
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
}

export type GetResult = null | User | Group | Action
