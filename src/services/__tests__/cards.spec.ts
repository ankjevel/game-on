import { Deck } from 'dataStore'
import * as cards from '../cards'

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
  const { Enum } = cards

  const toHex = <T>(array: number[]) =>
    (array.map(card => card.toString(16)) as any) as T

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
      expect.arrayContaining([cards.Hands.Pair, cards.Hands.Flush])
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
      expect.arrayContaining([cards.Hands.TwoPair])
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
      expect.arrayContaining([cards.Hands.FourOfAKind])
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
        cards.Hands.Pair,
        cards.Hands.FullHouse,
        cards.Hands.ThreeOfAKind,
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
      expect.arrayContaining([
        cards.Hands.StraightFlush,
        cards.Hands.RoyalFlush,
      ])
    )
  })

  it('gets the pair on hand', () => {
    const { onHand: hand } = cards.checkHand(
      [],
      toHex([Enum.Spades | 1, Enum.Hearts | 1])
    )
    expect(hand).toEqual(expect.arrayContaining([cards.Hands.Pair]))
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
