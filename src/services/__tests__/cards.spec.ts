import { Deck } from 'dataStore'
import * as cards from '../cards'

describe('#newDeck', () => {
  test('generates a new deck with expected hex-values', () => {
    const deck = cards.newDeck()

    expect(deck).toHaveLength(52)
    expect(deck).toMatchSnapshot()
    expect(deck[0]).toMatchInlineSnapshot(`"1F0A1"`)
    expect(deck[deck.length - 1]).toMatchInlineSnapshot(`"1F0D13"`)
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
