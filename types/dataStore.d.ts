export type Action = {
  id: string
  lastAction?: string
}

export type User = {
  id: string
}

export type Group = {
  id: string
  name: string
  startSum: number
  users: User[]
  action?: Action
}

export type CreateInput = {
  name?: string
  startSum?: number
}

export type GetResult = null | User | Group | Action
