import { HandParsed } from 'dataStore'

export type Card = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 13 | 14

export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'

/**
 * enum declared in `services/cards`
 */
export type Hand = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type Sorted = {
  spades: number[]
  hearts: number[]
  diamonds: number[]
  clubs: number[]
}

export type SameObject = {
  [value in Card]: number
}

export type Cards = string[]
export type Element = [string, HandParsed]
export type Tied = { index: number; insertInto: number; data: Element[] }

export interface HandOrder {
  (a: Element, b: Element): 0 | 1 | -1
}

export interface SortHigh {
  (a?: number | string, b?: number | string): 0 | 1 | -1
}
