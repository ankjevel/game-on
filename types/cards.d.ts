export type Card =
  | '1' // A
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11' // Kn
  | '12' // Q
  | '13' // K

export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'

export type SuitHex = '1F0A' | '1F0B' | '1F0C' | '1F0D'

export type Suits = {
  clubs: '1F0A'
  diamonds: '1F0B'
  hearts: '1F0C'
  spades: '1F0D'
}
