import { UserSummary } from 'dataStore'

export const turn = ({
  bet: 2,
  hand: undefined,
  handParsed: {
    highCards: [],
    onHand: [],
    parsed: {
      cards: {
        clubs: [],
        diamonds: [],
        hearts: [],
        spades: [],
      },
      flush: {
        clubs: false,
        diamonds: false,
        hearts: false,
        spades: false,
      },
      fourOfAKinds: [],
      pairs: [],
      same: {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
        '10': 0,
        '11': 0,
        '13': 0,
        '14': 0,
      },
      straightFlushes: [],
      threeOfAKinds: [],
    },
  },
  status: 'none',
} as any) as UserSummary

export default turn
