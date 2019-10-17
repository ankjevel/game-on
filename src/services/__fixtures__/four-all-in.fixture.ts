import { ActionRunningWithSidePot } from '../../../types/action'
import { Group, UserWithOutPassword } from '../../../types/dataStore'

export const group: Group = {
  id: 'group:a4472ffa-0646-40bb-b893-b72ab919f6d6',
  name: 'awesome',
  startSum: 200,
  blind: { small: 2, big: 4 },
  owner: 'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3',
  users: [
    { id: 'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3', sum: 0 },
    { id: 'user:04c4a68e-a638-427e-be30-1763ca219270', sum: 0 },
    { id: 'user:f2028356-1fd8-4bf1-b55b-611993223966', sum: 0 },
    { id: 'user:b5aa24e7-4d02-4420-9dd6-752dd508a306', sum: 0 },
  ],
  pub: true,
  action: 'action:86685fe1-9460-43ec-9fa5-9f32f7961396',
}

export const action: ActionRunningWithSidePot = {
  id: 'action:86685fe1-9460-43ec-9fa5-9f32f7961396',
  groupID: 'group:a4472ffa-0646-40bb-b893-b72ab919f6d6',
  queued: {},
  button: 'user:04c4a68e-a638-427e-be30-1763ca219270',
  big: 'user:04c4a68e-a638-427e-be30-1763ca219270',
  small: 'user:04c4a68e-a638-427e-be30-1763ca219270',
  turn: {
    'user:04c4a68e-a638-427e-be30-1763ca219270': {
      bet: 200,
      status: 'allIn',
      cards: ['c7', 'a8'],
      hand: 7,
      handParsed: {
        parsed: {
          cards: {
            spades: [8],
            hearts: [2, 7, 14],
            diamonds: [7],
            clubs: [2, 5],
          },
          flush: {
            spades: false,
            hearts: false,
            diamonds: false,
            clubs: false,
          },
          same: {
            '1': 0,
            '2': 2,
            '3': 0,
            '4': 0,
            '5': 1,
            '6': 0,
            '7': 2,
            '8': 1,
            '9': 0,
            '10': 0,
            '11': 0,
            '13': 0,
            '14': 1,
          },
          pairs: ['2', '7'],
          threeOfAKinds: [],
          fourOfAKinds: [],
          straightFlushes: [],
        },
        highCards: [14, 8, 7, 5, 2],
        onHand: [7, 8],
      },
    },
    'user:f2028356-1fd8-4bf1-b55b-611993223966': {
      bet: 200,
      status: 'allIn',
      cards: ['d9', 'c9'],
      hand: 7,
      handParsed: {
        parsed: {
          cards: {
            spades: [],
            hearts: [2, 7, 14],
            diamonds: [9],
            clubs: [2, 5, 9],
          },
          flush: {
            spades: false,
            hearts: false,
            diamonds: false,
            clubs: false,
          },
          same: {
            '1': 0,
            '2': 2,
            '3': 0,
            '4': 0,
            '5': 1,
            '6': 0,
            '7': 1,
            '8': 0,
            '9': 2,
            '10': 0,
            '11': 0,
            '13': 0,
            '14': 1,
          },
          pairs: ['2', '9'],
          threeOfAKinds: [],
          fourOfAKinds: [],
          straightFlushes: [],
        },
        highCards: [14, 9, 7, 5, 2],
        onHand: [7, 8],
      },
    },
    'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3': {
      bet: 200,
      status: 'allIn',
      cards: ['c1', 'dd'],
      hand: 8,
      handParsed: {
        parsed: {
          cards: {
            spades: [],
            hearts: [2, 7, 14],
            diamonds: [1],
            clubs: [2, 5, 13],
          },
          flush: {
            spades: false,
            hearts: false,
            diamonds: false,
            clubs: false,
          },
          same: {
            '1': 1,
            '2': 2,
            '3': 0,
            '4': 0,
            '5': 1,
            '6': 0,
            '7': 1,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 0,
            '13': 1,
            '14': 1,
          },
          pairs: ['2'],
          threeOfAKinds: [],
          fourOfAKinds: [],
          straightFlushes: [],
        },
        highCards: [1, 14, 13, 7, 5, 2],
        onHand: [8],
      },
    },
    'user:b5aa24e7-4d02-4420-9dd6-752dd508a306': {
      bet: 200,
      status: 'allIn',
      cards: ['aa', 'a7'],
      hand: 7,
      handParsed: {
        parsed: {
          cards: {
            spades: [7, 10],
            hearts: [2, 7, 14],
            diamonds: [],
            clubs: [2, 5],
          },
          flush: {
            spades: false,
            hearts: false,
            diamonds: false,
            clubs: false,
          },
          same: {
            '1': 0,
            '2': 2,
            '3': 0,
            '4': 0,
            '5': 1,
            '6': 0,
            '7': 2,
            '8': 0,
            '9': 0,
            '10': 1,
            '11': 0,
            '13': 0,
            '14': 1,
          },
          pairs: ['2', '7'],
          threeOfAKinds: [],
          fourOfAKinds: [],
          straightFlushes: [],
        },
        highCards: [14, 10, 7, 5, 2],
        onHand: [7, 8],
      },
    },
  },
  deck: [
    'd1',
    null,
    null,
    'd4',
    null,
    'd6',
    'd7',
    'd8',
    null,
    'da',
    'db',
    null,
    'de',
    null,
    null,
    'c3',
    'c4',
    'c5',
    'c6',
    null,
    'c8',
    null,
    'ca',
    null,
    'cd',
    'ce',
    'b1',
    null,
    'b3',
    'b4',
    'b5',
    'b6',
    null,
    'b8',
    'b9',
    'ba',
    'bb',
    'bd',
    null,
    'a1',
    'a2',
    'a3',
    'a4',
    'a5',
    'a6',
    null,
    null,
    'a9',
    null,
    'ab',
    'ad',
    'ae',
  ],
  communityCards: ['d2', 'b2', 'b7', 'd5', 'be'],
  pot: 800,
  round: 4,
  sidePot: [
    { id: 'user:04c4a68e-a638-427e-be30-1763ca219270', sum: 200 },
    { id: 'user:f2028356-1fd8-4bf1-b55b-611993223966', sum: 200 },
    { id: 'user:b5aa24e7-4d02-4420-9dd6-752dd508a306', sum: 200 },
    { id: 'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3', sum: 200 },
  ],
  winners: [
    ['user:f2028356-1fd8-4bf1-b55b-611993223966'],
    ['user:b5aa24e7-4d02-4420-9dd6-752dd508a306'],
    ['user:04c4a68e-a638-427e-be30-1763ca219270'],
  ],
}

export const users: UserWithOutPassword[] = [
  { id: 'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3', name: 'normal' },
  { id: 'user:04c4a68e-a638-427e-be30-1763ca219270', name: 'blue' },
  { id: 'user:f2028356-1fd8-4bf1-b55b-611993223966', name: 'orange' },
  { id: 'user:b5aa24e7-4d02-4420-9dd6-752dd508a306', name: 'green' },
]
