export type Card = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

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
