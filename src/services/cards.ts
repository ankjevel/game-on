import { Suit } from 'cards'
import { MutableDeck, Deck } from 'dataStore'

/**
 * Card | Suit | value
 */
export enum Enum {
  Card = 0x1f000,
  Spades = 0xa0,
  Hearts = 0xb0,
  Diamonds = 0xc0,
  Clubs = 0xd0,
}

const getHEX = (suit: Suit): number => {
  switch (suit) {
    case 'clubs':
      return Enum.Clubs
    case 'diamonds':
      return Enum.Diamonds
    case 'hearts':
      return Enum.Hearts
    case 'spades':
      return Enum.Spades
    default:
      throw new Error('missing suit')
  }
}

const genCards = (hex: number) =>
  [...new Array(14)]
    .map((_, i) => {
      if (i === 10) {
        // 10 is Jack
        return null
      }
      return (hex | (i + 1)).toString(16)
    })
    .filter(x => x) as Tuple<string, 13>

const genSuit = (suit: Suit) => {
  if (
    suit !== 'clubs' &&
    suit !== 'diamonds' &&
    suit !== 'hearts' &&
    suit !== 'spades'
  ) {
    throw new Error('missing suit')
  }

  return genCards(getHEX(suit))
}

const DECK = (['clubs', 'diamonds', 'hearts', 'spades'] as Suit[]).flatMap(
  suit => genSuit(suit)
) as Deck

export const newDeck = () => DECK.slice(0) as Deck

/**
 *
 * @param deck  Mutable parameter
 * @param take  Value between 1 and Infinity
 */
export const takeCards = <T>(deck: MutableDeck, take: number): T => {
  const result: string[] = []

  for (const _ of Array(take).fill(undefined)) {
    let cards = deck.filter(x => typeof x === 'string')

    if (cards.length < 1) {
      deck.splice(0, 0, ...DECK.slice(0))
      cards = deck
    }

    const index = Math.floor(Math.random() * (cards.length - 1))
    const card = cards[index]
    const indexOfCard = deck.indexOf(card)

    if (!card || indexOfCard === -1) {
      throw new Error('missing card!')
    }

    deck.splice(indexOfCard, 1, null)

    result.push(card)
  }

  return (result as unknown) as T
}
