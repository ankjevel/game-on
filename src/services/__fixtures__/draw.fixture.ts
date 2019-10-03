import { ActionRunningWithSidePot } from 'action'
import { Group, UserWithOutPassword } from 'dataStore'

export const group: Group = {
  id: 'group:016650b1-8c11-41e3-b00f-a616469a3b1b',
  name: 'super-duper-normal',
  startSum: 140,
  blind: { small: 1, big: 2 },
  pub: true,
  owner: 'user:0f3bd090-e991-425a-8978-71ad27164510',
  users: [
    { id: 'user:0f3bd090-e991-425a-8978-71ad27164510', sum: 140 },
    { id: 'user:63d94748-7134-4d5c-b3f9-612f9c0520c4', sum: 0 },
    { id: 'user:f7fefb97-1cd6-4507-b312-611d157a65bf', sum: 0 },
  ],
  action: 'action:20ffb4b3-7fab-437c-be1e-cbd0efb8e00c',
}

export const action: ActionRunningWithSidePot = {
  id: 'action:20ffb4b3-7fab-437c-be1e-cbd0efb8e00c',
  groupID: 'group:016650b1-8c11-41e3-b00f-a616469a3b1b',
  queued: {},
  button: 'user:63d94748-7134-4d5c-b3f9-612f9c0520c4',
  big: 'user:63d94748-7134-4d5c-b3f9-612f9c0520c4',
  small: 'user:63d94748-7134-4d5c-b3f9-612f9c0520c4',
  winners: [], // declare in code
  turn: {
    'user:63d94748-7134-4d5c-b3f9-612f9c0520c4': {
      bet: 140,
      status: 'allIn',
      cards: ['b9', 'a4'],
      hand: 8,
      handParsed: {
        parsed: {
          cards: {
            spades: [4, 11],
            hearts: [7, 9],
            diamonds: [6, 14],
            clubs: [4],
          },
          flush: {
            spades: false,
            hearts: false,
            diamonds: false,
            clubs: false,
          },
          same: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 2,
            '5': 0,
            '6': 1,
            '7': 1,
            '8': 0,
            '9': 1,
            '10': 0,
            '11': 1,
            '13': 0,
            '14': 1,
          },
          pairs: ['4'],
          threeOfAKinds: [],
          fourOfAKinds: [],
          straightFlushes: [],
        },
        highCards: [14, 11, 9, 7, 6, 4],
        onHand: [8],
      },
    },
    'user:f7fefb97-1cd6-4507-b312-611d157a65bf': {
      bet: 140,
      status: 'allIn',
      cards: ['de', 'a3'],
      hand: 8,
      handParsed: {
        parsed: {
          cards: {
            spades: [3, 11],
            hearts: [7],
            diamonds: [6, 14],
            clubs: [4, 14],
          },
          flush: {
            spades: false,
            hearts: false,
            diamonds: false,
            clubs: false,
          },
          same: {
            '1': 0,
            '2': 0,
            '3': 1,
            '4': 1,
            '5': 0,
            '6': 1,
            '7': 1,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 1,
            '13': 0,
            '14': 2,
          },
          pairs: ['14'],
          threeOfAKinds: [],
          fourOfAKinds: [],
          straightFlushes: [],
        },
        highCards: [14, 11, 7, 6, 4, 3],
        onHand: [8],
      },
    },
    'user:0f3bd090-e991-425a-8978-71ad27164510': {
      bet: 0,
      status: 'fold',
      cards: ['a7', 'b2'],
      hand: 8,
      handParsed: {
        parsed: {
          cards: {
            spades: [7, 11],
            hearts: [2, 7],
            diamonds: [6, 14],
            clubs: [4],
          },
          flush: {
            spades: false,
            hearts: false,
            diamonds: false,
            clubs: false,
          },
          same: {
            '1': 0,
            '2': 1,
            '3': 0,
            '4': 1,
            '5': 0,
            '6': 1,
            '7': 2,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 1,
            '13': 0,
            '14': 1,
          },
          pairs: ['7'],
          threeOfAKinds: [],
          fourOfAKinds: [],
          straightFlushes: [],
        },
        highCards: [14, 11, 7, 6, 4, 2],
        onHand: [8],
      },
    },
  },
  deck: [
    null,
    'd2',
    'd3',
    null,
    'd5',
    'd6',
    'd7',
    'd8',
    'd9',
    'da',
    'db',
    'dd',
    null,
    'c1',
    'c2',
    'c3',
    'c4',
    'c5',
    null,
    'c7',
    'c8',
    'c9',
    'ca',
    'cb',
    'cd',
    null,
    null,
    null,
    'b3',
    'b4',
    'b5',
    'b6',
    null,
    'b8',
    null,
    'ba',
    'bb',
    'bd',
    'be',
    'a1',
    null,
    null,
    null,
    'a5',
    'a6',
    null,
    'a8',
    'a9',
    'aa',
    null,
    'ad',
    'ae',
  ],
  communityCards: ['ce', 'b7', 'ab', 'd4', 'c6'],
  pot: 280,
  round: 4,
  sidePot: [
    { id: 'user:63d94748-7134-4d5c-b3f9-612f9c0520c4', sum: 140 },
    { id: 'user:f7fefb97-1cd6-4507-b312-611d157a65bf', sum: 140 },
  ],
}

export const users: UserWithOutPassword[] = [
  { id: 'user:f7fefb97-1cd6-4507-b312-611d157a65bf', name: 'pink' },
  { id: 'user:0f3bd090-e991-425a-8978-71ad27164510', name: 'super' },
  { id: 'user:63d94748-7134-4d5c-b3f9-612f9c0520c4', name: 'blue' },
]
