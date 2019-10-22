import { Sorted, SameObject, Hand, Card } from 'cards'

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
  round: 0 | 1 | 2 | 3 | 4 | 5
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
  winners?: User['id'][][]
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
  | 'back'
  | 'bank'
  | 'join'
  | 'leave'
  | 'sittingOut'
  | 'confirm'
  | 'forceConfirmAll'

export type NewAction = {
  type: NewActionEnum
  value?: number
}

export type HandParsed = {
  parsed: {
    cards: Sorted
    flush: {
      spades: boolean
      hearts: boolean
      diamonds: boolean
      clubs: boolean
    }
    fourOfAKinds: string[]
    pairs: string[]
    same: SameObject
    straightFlushes: string[]
    straightHigh?: string
    threeOfAKinds: string[]
  }
  highCards: Card[]
  onHand: Hand[]
}

export type UserSummary = {
  bet: number
  status: NewActionEnum
  cards?: [string, string]
  hand?: Hand
  handParsed?: HandParsed
}

export type Check = <T>(result: T) => boolean

export type Order<T = string> = { [P in keyof T]: T }
