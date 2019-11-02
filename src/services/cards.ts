import {
  Card,
  Cards,
  Element,
  Hand,
  HandOrder,
  SameObject,
  Sorted,
  SortHigh,
  Suit,
  Tied,
} from 'cards'
import { MutableDeck, Deck, ActionRunning, HandParsed } from 'dataStore'

import { n, clone } from '../utils'

export enum HandEnum {
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
  clone(n(14).reduce((x, _, i) => {
    if (i === 11) return x
    x[i + 1] = 0
    return x
  }, {}) as SameObject)

const defaultFlushObject = () =>
  clone({
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
  n(14)
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

  for (const _ of n(take)) {
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

export const sortCards = (cards: Card[]) =>
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
    [...communityCards, ...hand].map(card => parseInt(card, 16) as Card)
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
    .filter(([, amount]) => amount >= 2)
    .map(([card]) => card)
  const threeOfAKinds = sameEntries
    .filter(([, amount]) => amount >= 3)
    .map(([card]) => card)
  const fourOfAKinds = sameEntries
    .filter(([, amount]) => amount >= 4)
    .map(([card]) => card)
  const straightFlushes = Object.entries(flush)
    .filter(([suit, isFlush]) => isFlush && hasStraight(cards[suit])[0])
    .map(([suit]) => suit)

  return {
    cards,
    flush,
    same,
    pairs,
    threeOfAKinds,
    fourOfAKinds,
    straightFlushes,
  } as HandParsed['parsed']
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
  const slice: number[] = cards.slice(index, cards.length).slice(0, 5)

  const hasStraight =
    slice.length >= 5 &&
    slice.every(
      (card, i, cards) =>
        i === 0 || straightOrders[orderIndex][card] === cards[i - 1]
    )

  return [hasStraight, slice]
}

export const hasStraight = (cards: number[]) => {
  let straight: number[] = []

  const hasStraight =
    cards.sort(sort).some((_, i, cards) => {
      const [hasStraight, result] = sliceAndCheck(cards, i, 0)
      if (hasStraight) {
        straight = result as any
      }
      return hasStraight
    }) ||
    cards.sort(sortAceLast).some((_, i, cards) => {
      const [hasStraight, result] = sliceAndCheck(cards, i, 1)
      if (hasStraight) {
        straight = result as any
      }
      return hasStraight
    })

  return [hasStraight, straight]
}

export const sortHands = (turn: ActionRunning['turn']) => {
  const tied: Tied[] = []
  const reduced = Object.entries(turn)
    .filter(([, summary]) => summary.status !== 'fold')
    .reduce(
      (order, [id, { handParsed }]) => {
        order[
          handParsed == null ||
          Array.isArray(handParsed.onHand) === false ||
          !handParsed.onHand.length
            ? HandEnum.HighCard
            : handParsed.onHand[0]
        ].push([id, handParsed] as any)
        return order
      },
      n(HandEnum.HighCard + 1).map(() => [] as any) as Element[]
    )
  const sorted = reduced.map((order, index) => {
    if (order.length <= 1) {
      return order
    }

    return order.sort((a: any, b: any) => {
      const sortOrder = getHandOrder(index)(a, b)

      if (sortOrder === 0) {
        const _a = order.splice(order.indexOf(a), 1).pop() as any
        const _b = order.splice(order.indexOf(b), 1).pop() as any

        if (_a == null) {
          return -1
        }

        if (_b == null) {
          return 1
        }

        const insertInto = order.length
          ? getHandOrder(index)(_a, order[0] as any)
          : index

        tied.push({
          index,
          insertInto: index + insertInto,
          data: [_a, _b],
        } as any)
      }

      return sortOrder
    })
  })

  while (tied.length > 0) {
    if (tied.length === 0) {
      break
    }

    let tie: MaybeUndefined<Tied>
    while ((tie = tied.pop())) {
      if (tie == null) {
        break
      }

      const { index, insertInto, data } = tie

      for (const element of data) {
        sorted[index].splice(sorted[index].indexOf(element as any), 1)
      }

      const next = index + 1
      const last = next === HandEnum.HighCard + 1

      if (last) {
        sorted.splice(insertInto, 0, [data] as any)
        break
      }

      const order = getHandOrder(next)(data[0], data[1])

      if (order === 0) {
        tied.push({ index: next, insertInto, data })
      } else {
        const result =
          order === -1 ? [[data[0]], [data[1]]] : [[data[1]], [data[0]]]
        sorted.splice(insertInto, 0, result as any)
        break
      }
    }
  }

  return sorted
    .filter(x => x.length)
    .reduce(
      (array, element: any) =>
        array.concat(
          element.map((inner: Element | Element[]) => {
            if (Array.isArray(inner[0])) {
              return (inner as Element[]).map(e => e[0])
            }
            return [inner[0]]
          })
        ),
      [] as string[][]
    )
}

const sortHigh: SortHigh = (a, b) => {
  const aParsed = typeof a === 'number' ? a : parseInt(a || '-1')
  const bParsed = typeof b === 'number' ? b : parseInt(b || '-1')
  const aValue = aParsed === 1 ? 15 : aParsed
  const bValue = bParsed === 1 ? 15 : bParsed
  return aValue > bValue ? -1 : bValue > aValue ? 1 : 0
}

const each = (a: any[], b: any[], check: SortHigh = sortHigh) => {
  let high: 0 | 1 | -1 = 0
  for (const i of n(Math.max(a.length, b.length))) {
    const res = check(a[i], b[i])
    if (res === 0) continue
    high = res
    break
  }
  return high
}

const getSuit = (parsed: HandParsed['parsed']) =>
  (parsed.cards[
    Object.entries(parsed.flush)
      .filter(x => x[1])
      .map(x => x[0]) as any
  ] || []) as number[]

export const getHandOrder = (hand: HandEnum): HandOrder => {
  switch (hand) {
    case HandEnum.FourOfAKind: {
      return ([, { parsed: a }], [, { parsed: b }]) =>
        each(a.fourOfAKinds, b.fourOfAKinds)
    }
    case HandEnum.FullHouse:
      return ([, { parsed: a }], [, { parsed: b }]) =>
        each(a.threeOfAKinds, b.threeOfAKinds) || each(a.pairs, b.pairs)
    case HandEnum.RoyalFlush:
    case HandEnum.StraightFlush:
    case HandEnum.Flush:
      return ([, { parsed: a }], [, { parsed: b }]) =>
        each(getSuit(a), getSuit(b))
    case HandEnum.Straight:
      return ([, { parsed: a }], [, { parsed: b }]) =>
        sortHigh(a.straightHigh, b.straightHigh)
    case HandEnum.ThreeOfAKind:
      return ([, { parsed: a }], [, { parsed: b }]) =>
        each(a.threeOfAKinds, b.threeOfAKinds)
    case HandEnum.TwoPair:
    case HandEnum.Pair:
      return ([, { parsed: a }], [, { parsed: b }]) => each(a.pairs, b.pairs)
    case HandEnum.HighCard:
      return ([, { highCards: a }], [, { highCards: b }]) => each(a, b)
    default:
      throw new Error(`Hand not defined (${hand})`)
  }
}

export const checkHand = (communityCards: Cards, hand: Cards) => {
  const parsed = parseHand(communityCards, hand)
  const cards = [...new Set(Object.values(parsed.cards).flatMap(x => x))].sort(
    sort
  )
  const highCards = cards
    .slice(0)
    .sort(sortAceLast)
    .reverse() as Card[]
  const pair = parsed.pairs.length >= 1
  const twoPair = parsed.pairs.length >= 2
  const threeOfAKind = parsed.threeOfAKinds.length >= 1
  const [hadStraight, straight] = hasStraight(cards.slice(0))
  const flush = Object.values(parsed.flush).some(flush => flush)
  const fullHouse = parsed.pairs.length >= 2 && parsed.threeOfAKinds.length >= 1
  const fourOfAKind = parsed.fourOfAKinds.length >= 1
  const straightFlush = parsed.straightFlushes.length >= 1
  const royalFlush = parsed.straightFlushes
    .map(
      suit =>
        parsed.cards[suit].filter(i => [10, 11, 13, 14, 1].includes(i))
          .length === 5
    )
    .some(bool => bool)

  parsed.straightHigh = ((straight as number[]) || []).pop() as any

  return {
    parsed,
    highCards,
    onHand: [
      [HandEnum.RoyalFlush, royalFlush],
      [HandEnum.StraightFlush, straightFlush],
      [HandEnum.FourOfAKind, fourOfAKind],
      [HandEnum.FullHouse, fullHouse],
      [HandEnum.Flush, flush],
      [HandEnum.Straight, hadStraight],
      [HandEnum.ThreeOfAKind, threeOfAKind],
      [HandEnum.TwoPair, twoPair],
      [HandEnum.Pair, pair],
    ]
      .filter(([, hasOnHand]) => hasOnHand)
      .map(([hand]) => hand) as Hand[],
  }
}

export default newDeck
