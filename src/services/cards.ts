import { Suit, SuitHex, Card } from 'cards'
import { MutableDeck, Deck } from 'dataStore'

const getHEX = (suit: Suit): SuitHex => {
  switch (suit) {
    case 'clubs':
      return '1F0A'
    case 'diamonds':
      return '1F0B'
    case 'hearts':
      return '1F0C'
    case 'spades':
      return '1F0D'
    default:
      throw new Error('missing suit')
  }
}

const genCards = (hex: SuitHex) =>
  [...new Array(13)].map((_, i) => {
    const card = `${i + 1}` as Card
    return `${hex}${card}`
  }) as Tuple<string, 13>

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
