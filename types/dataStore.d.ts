export interface Action {
  id: string
  lastAction?: string
}

export interface User {
  id: string
  name: string
}

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
}

export type GetResult = null | User | Group | Action
