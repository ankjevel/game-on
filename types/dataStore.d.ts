export interface Action {
  id: string
}

export interface ActionRunning extends Action {
  /**
   * 0: preflop
   * 1: flop
   * 2: turn
   * 3: river
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
  deck: Deck
  communityCards: string[]
  sidePot?: { id: User['id']; sum: number }[]
}

export type Deck = Tuple<MaybeNull<string>, 52>
/**
 * Same as Deck, but will mutate
 */
export type MutableDeck = Deck

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
  pub: boolean
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
  cards?: [string, string]
  hand?: number // Hands
}

export type Check = <T>(result: T) => boolean

export type Order = { [order: string]: string }
