import { Deck, ActionRunning, User } from 'dataStore'
import { clone } from '../../utils'
import * as fixture from '../__fixtures__/calculate-winner.fixture'

import * as cards from '../cards'

const { Enum } = cards
const toHex = <T>(array: number[]) =>
  (array.map(card => card.toString(16)) as any) as T

describe('#newDeck', () => {
  test('generates a new deck with expected hex-values', () => {
    const deck = cards.newDeck()

    expect(deck).toHaveLength(52)
    expect(deck).toMatchSnapshot()
    expect(deck[0]).toMatchInlineSnapshot(`"d1"`)
    expect(deck[deck.length - 1]).toMatchInlineSnapshot(`"ae"`)
  })
})

describe('#takeCards', () => {
  test('it returns the expected amount of cards from the deck', () => {
    const deck = cards.newDeck() as Deck
    const take = cards.takeCards(deck, 2)

    expect(take).toHaveLength(2)
    expect(deck.filter(x => x == null)).toHaveLength(2)
  })
})

describe('#checkHand', () => {
  it('has a high card (ACE high, then King)', () => {
    const hand = [Enum.Spades | 1, Enum.Spades | 3]
    const communityCards = [
      Enum.Hearts | 13,
      Enum.Diamonds | 12,
      Enum.Clubs | 6,
      Enum.Clubs | 5,
      Enum.Clubs | 10,
    ]

    const { onHand, highCards } = cards.checkHand(
      toHex(communityCards),
      toHex(hand)
    )

    expect(onHand).toEqual([])
    expect(highCards[0]).toEqual(1)
    expect(highCards[1]).toEqual(13)
  })

  it('should get a `flush` and `pair`', () => {
    const hand = [Enum.Spades | 1, Enum.Spades | 2]
    const communityCards = [
      Enum.Clubs | 13,
      Enum.Clubs | 1,
      Enum.Clubs | 6,
      Enum.Clubs | 5,
      Enum.Clubs | 10,
    ]

    expect(cards.checkHand(toHex(communityCards), toHex(hand)).onHand).toEqual(
      expect.arrayContaining([cards.Hand.Pair, cards.Hand.Flush])
    )
  })

  it('gets `twoPair`', () => {
    const hand = [Enum.Spades | 2, Enum.Spades | 3]
    const communityCards = [
      Enum.Clubs | 13,
      Enum.Clubs | 1,
      Enum.Hearts | 13,
      Enum.Hearts | 1,
      Enum.Clubs | 4,
    ]

    expect(cards.checkHand(toHex(communityCards), toHex(hand)).onHand).toEqual(
      expect.arrayContaining([cards.Hand.TwoPair])
    )
  })

  it('gets `fourOfAKind`', () => {
    const hand = [Enum.Spades | 1, Enum.Clubs | 1]
    const communityCards = [
      Enum.Diamonds | 1,
      Enum.Hearts | 1,
      Enum.Clubs | 6,
      Enum.Clubs | 5,
      Enum.Clubs | 10,
    ]

    expect(cards.checkHand(toHex(communityCards), toHex(hand)).onHand).toEqual(
      expect.arrayContaining([cards.Hand.FourOfAKind])
    )
  })

  it('gets `threeOfAKind` and `fullHouse`', () => {
    const hand = [Enum.Spades | 1, Enum.Clubs | 1]
    const communityCards = [
      Enum.Diamonds | 1,
      Enum.Hearts | 2,
      Enum.Clubs | 2,
      Enum.Clubs | 5,
      Enum.Clubs | 10,
    ]

    expect(cards.checkHand(toHex(communityCards), toHex(hand)).onHand).toEqual(
      expect.arrayContaining([
        cards.Hand.Pair,
        cards.Hand.FullHouse,
        cards.Hand.ThreeOfAKind,
      ])
    )
  })

  it('gets a royal flush', () => {
    const hand = [Enum.Spades | 1, Enum.Spades | 2]
    const communityCards = [
      Enum.Clubs | 13,
      Enum.Clubs | 1,
      Enum.Clubs | 11,
      Enum.Clubs | 10,
      Enum.Clubs | 14,
    ]

    expect(cards.checkHand(toHex(communityCards), toHex(hand)).onHand).toEqual(
      expect.arrayContaining([cards.Hand.StraightFlush, cards.Hand.RoyalFlush])
    )
  })

  it('gets the pair on hand', () => {
    const { onHand: hand } = cards.checkHand(
      [],
      toHex([Enum.Spades | 1, Enum.Hearts | 1])
    )
    expect(hand).toEqual(expect.arrayContaining([cards.Hand.Pair]))
  })
})

describe('#hasStraight', () => {
  it('returns true if hand has straight', () => {
    const { hasStraight: straight } = cards
    expect(straight([1, 2, 3, 4, 5])).toEqual(true)
    expect(straight([2, 3, 4, 5, 7])).toEqual(false)
    expect(straight([1, 10, 11, 13, 14])).toEqual(true)
    expect(straight([1, 2, 3, 4, 5, 13, 10])).toEqual(true)
    expect(straight([1, 6, 7, 10, 11, 13, 14])).toEqual(true)
  })
})

describe.only('#sortHands', () => {
  const { Clubs, Hearts, Diamonds, Spades } = Enum
  const generate = (
    communityCards: string[],
    users: [string, [number, number]][]
  ) =>
    users.reduce((turnObject, [id, userCards]) => {
      const handParsed = cards.checkHand(communityCards, toHex(userCards))
      turnObject[`user:${id}`] = {
        bet: 2,
        hand: handParsed.onHand.slice(0)[0],
        handParsed,
      }
      return turnObject
    }, {})

  it('handles `HighCards`', () => {
    expect(
      cards.sortHands(
        generate(
          toHex([Clubs | 2, Spades | 3, Clubs | 4, Spades | 5, Clubs | 7]),
          [
            ['8-high', [Diamonds | 9, Hearts | 8]],
            ['K-high', [Diamonds | 13, Hearts | 9]],
            ['A-high', [Diamonds | 1, Spades | 13]],
          ]
        )
      ),
      'handles HighCards'
    ).toEqual([['user:A-high'], ['user:K-high'], ['user:8-high']])
  })

  it('handles `Pair|TwoPair`', () => {
    expect(
      cards.sortHands(
        generate(
          toHex([Clubs | 11, Spades | 11, Clubs | 9, Spades | 9, Clubs | 5]),
          [
            ['J-high', [Hearts | 4, Diamonds | 3]],
            ['A-high', [Hearts | 1, Diamonds | 1]],
            ['K-high', [Hearts | 13, Diamonds | 13]],
          ]
        )
      ),
      'handles TwoPair'
    ).toEqual([['user:A-high'], ['user:K-high'], ['user:J-high']])

    expect(
      cards.sortHands(
        generate(
          toHex([Clubs | 13, Clubs | 10, Clubs | 11, Spades | 6, Clubs | 5]),
          [
            ['K-high', [Hearts | 14, Hearts | 14]],
            ['none', [Spades | 3, Spades | 4]],
            ['A-high', [Diamonds | 1, Hearts | 1]],
          ]
        )
      ),
      'handles Pair'
    ).toEqual([['user:A-high'], ['user:K-high'], ['user:none']])

    expect(
      cards.sortHands(
        generate(
          toHex([Clubs | 13, Clubs | 10, Diamonds | 11, Spades | 6, Clubs | 5]),
          [
            ['Hearts-Diamonds', [Hearts | 14, Diamonds | 14]],
            ['Spades-Clubs', [Spades | 14, Clubs | 14]],
            ['2-high', [Diamonds | 2, Hearts | 2]],
          ]
        )
      ),
      'handles a draw'
    ).toEqual([
      expect.arrayContaining(['user:Hearts-Diamonds', 'user:Spades-Clubs']),
      ['user:2-high'],
    ])
  })

  it('handles `Straight`', () => {
    const communityCards: string[] = toHex([
      Clubs | 13,
      Clubs | 10,
      Clubs | 11,
      Spades | 6,
      Clubs | 5,
    ])

    expect(
      cards.sortHands(
        generate(communityCards, [
          ['Q-high', [Diamonds | 8, Hearts | 9]],
          ['K-high', [Hearts | 14, Hearts | 9]],
          ['pair', [Spades | 5, Spades | 4]],
        ])
      )
    ).toEqual([['user:K-high'], ['user:Q-high'], ['user:pair']])

    expect(
      cards.sortHands(
        generate(communityCards, [
          ['A-high', [Diamonds | 14, Hearts | 1]],
          ['K-high', [Hearts | 14, Hearts | 9]],
          ['pair', [Spades | 5, Spades | 4]],
        ])
      )
    ).toEqual([['user:A-high'], ['user:K-high'], ['user:pair']])
  })

  it('handles `Flush`', () => {
    expect(
      cards.sortHands(
        generate(
          toHex([Clubs | 8, Clubs | 10, Clubs | 11, Spades | 6, Clubs | 5]),
          [
            ['K-high', [Hearts | 3, Clubs | 13]],
            ['pair', [Spades | 5, Spades | 4]],
            ['A-high', [Clubs | 1, Hearts | 2]],
          ]
        )
      )
    ).toEqual([['user:A-high'], ['user:K-high'], ['user:pair']])
  })

  it('handles `FourOfAKind`', () => {
    expect(
      cards.sortHands(
        generate(
          toHex([Clubs | 2, Spades | 2, Hearts | 2, Diamonds | 6, Hearts | 6]),
          [
            ['2-high', [Diamonds | 2, Clubs | 3]],
            ['6-high', [Spades | 6, Clubs | 6]],
            ['none', [Clubs | 3, Hearts | 4]],
          ]
        )
      )
    ).toEqual([['user:6-high'], ['user:2-high'], ['user:none']])

    expect(
      cards.sortHands(
        generate(
          toHex([Clubs | 2, Spades | 2, Hearts | 2, Diamonds | 6, Hearts | 6]),
          [
            ['four-of-kind', [Diamonds | 2, Clubs | 3]],
            ['full-house-6-high', [Spades | 6, Clubs | 3]],
            ['full-house-6-high-low', [Clubs | 3, Hearts | 4]],
          ]
        )
      )
    ).toEqual([
      ['user:four-of-kind'],
      ['user:full-house-6-high'],
      ['user:full-house-6-high-low'],
    ])
  })
})
