import { Suit } from 'cards'
import { MutableDeck, Deck } from 'dataStore'

type Sorted = {
  spades: number[]
  hearts: number[]
  diamonds: number[]
  clubs: number[]
}

type SameObject = {
  1: number
  2: number
  3: number
  4: number
  5: number
  6: number
  7: number
  8: number
  9: number
  10: number
  11: number
  13: number
  14: number
}

type Cards = string[]

export enum Hand {
  RoyalFlush = 0,
  StraightFlush = 1,
  FourOfAKind = 2,
  FullHouse = 3,
  Flush = 4,
  Straight = 5,
  ThreeOfAKind = 6,
  TwoPair = 7,
  Pair = 8,
  HighCard = 9,
}

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

const defaultSameObject = () =>
  [...Array(14)].reduce((x, _, i) => {
    if (i === 11) return x
    x[i + 1] = 0
    return x
  }, {}) as SameObject

const defaultFlushObject = () => ({
  spades: false,
  hearts: false,
  diamonds: false,
  clubs: false,
})

const sort = (a: number, b: number) => (a > b ? 1 : a < b ? -1 : 0)
const sortAceLast = (a: number, b: number) =>
  a === 1 ? 1 : b === 1 ? -1 : a > b ? 1 : a < b ? -1 : 0

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
      if (i === 11) {
        // 11 is Knight
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

export const sortCards = (cards: number[]) =>
  Object.entries(
    cards.reduce(
      (suits: Sorted, card) => {
        if ((card ^ Enum.Hearts) <= 14) {
          suits.hearts.push(card ^ Enum.Hearts)
        }
        if ((card ^ Enum.Diamonds) <= 14) {
          suits.diamonds.push(card ^ Enum.Diamonds)
        }
        if ((card ^ Enum.Clubs) <= 14) {
          suits.clubs.push(card ^ Enum.Clubs)
        }
        if ((card ^ Enum.Spades) <= 14) {
          suits.spades.push(card ^ Enum.Spades)
        }
        return suits
      },
      {
        spades: [],
        hearts: [],
        diamonds: [],
        clubs: [],
      }
    )
  ).reduce((suits, [suit, cards]) => {
    suits[suit] = cards.sort(sort)
    return suits
  }, {}) as Sorted

export const parseHand = (communityCards: Cards, hand: Cards) => {
  const cards = sortCards(
    [...communityCards, ...hand].map(card => parseInt(card, 16))
  )
  const flush = Object.entries(cards).reduce((flush, [suit, cards]) => {
    flush[suit] = cards.length >= 5
    return flush
  }, defaultFlushObject())
  const same = Object.values(cards).reduce((list, cards) => {
    cards.forEach(card => ++list[card])
    return list
  }, defaultSameObject())
  const sameEntries = Object.entries(same)
  const pairs = sameEntries
    .filter(([, amount]) => amount === 2)
    .map(([card]) => card)
  const threeOfAKinds = sameEntries
    .filter(([, amount]) => amount === 3)
    .map(([card]) => card)
  const fourOfAKinds = sameEntries
    .filter(([, amount]) => amount === 4)
    .map(([card]) => card)
  const straightFlushes = Object.entries(flush)
    .filter(([suit, isFlush]) => isFlush && hasStraight(cards[suit]))
    .map(([suit]) => suit)

  return {
    cards,
    flush,
    same,
    pairs,
    threeOfAKinds,
    fourOfAKinds,
    straightFlushes,
  }
}

const straightOrders = [
  {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 7,
    9: 8,
    10: 9,
    11: 10,
    13: 11,
    14: 13,
  },
  {
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 7,
    9: 8,
    10: 9,
    11: 10,
    13: 11,
    14: 13,
    1: 14,
  },
]

const sliceAndCheck = (cards: number[], index: number, orderIndex: number) => {
  const slice = cards.slice(index, cards.length).slice(0, 5)
  return (
    slice.length >= 5 &&
    slice.every(
      (card, i, cards) =>
        i === 0 || straightOrders[orderIndex][card] === cards[i - 1]
    )
  )
}

export const hasStraight = (cards: number[]) =>
  cards.sort(sort).some((_, i, cards) => sliceAndCheck(cards, i, 0)) ||
  cards.sort(sortAceLast).some((_, i, cards) => sliceAndCheck(cards, i, 1))

export const checkHand = (communityCards: Cards, hand: Cards) => {
  const parsed = parseHand(communityCards, hand)
  const cards = [...new Set(Object.values(parsed.cards).flatMap(x => x))].sort(
    sort
  )

  const highCards = cards
    .slice(0)
    .sort(sortAceLast)
    .reverse()
  const pair = parsed.pairs.length >= 1
  const twoPair = parsed.pairs.length >= 2
  const threeOfAKind = parsed.threeOfAKinds.length >= 1
  const straight = hasStraight(cards.slice(0))
  const flush = Object.values(parsed.flush).some(flush => flush)
  const fullHouse = parsed.pairs.length >= 1 && parsed.threeOfAKinds.length >= 1
  const fourOfAKind = parsed.fourOfAKinds.length >= 1
  const straightFlush = parsed.straightFlushes.length >= 1
  const royalFlush = parsed.straightFlushes
    .map(
      suit =>
        parsed.cards[suit].filter(i => [10, 11, 13, 14, 1].includes(i))
          .length === 5
    )
    .some(bool => bool)

  const onHand = [
    [Hand.RoyalFlush, royalFlush],
    [Hand.StraightFlush, straightFlush],
    [Hand.FourOfAKind, fourOfAKind],
    [Hand.FullHouse, fullHouse],
    [Hand.Flush, flush],
    [Hand.Straight, straight],
    [Hand.ThreeOfAKind, threeOfAKind],
    [Hand.TwoPair, twoPair],
    [Hand.Pair, pair],
  ]
    .filter(([, hasOnHand]) => hasOnHand)
    .map(([hand]) => hand) as Hand[]

  return {
    parsed,
    highCards,
    onHand,
  }
}

export default newDeck
