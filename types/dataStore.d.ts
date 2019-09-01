export type Group = {
  id: string
  users: string[]
}

export type CreateInput = {
  name?: string
  startSum?: number
}

export type GetResult = null | string | Group
