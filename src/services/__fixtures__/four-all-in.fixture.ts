import { ActionRunningWithSidePot } from '../../../types/action'
import { Group, UserWithOutPassword } from '../../../types/dataStore'

export const group: Group = {
  users: [
    { id: 'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3', sum: 0 },
    { id: 'user:04c4a68e-a638-427e-be30-1763ca219270', sum: 0 },
    { id: 'user:f2028356-1fd8-4bf1-b55b-611993223966', sum: 0 },
    { id: 'user:b5aa24e7-4d02-4420-9dd6-752dd508a306', sum: 0 },
  ],
} as any

export const action: ActionRunningWithSidePot = {
  big: 'user:b5aa24e7-4d02-4420-9dd6-752dd508a306',
  turn: {
    'user:04c4a68e-a638-427e-be30-1763ca219270': {
      bet: 187,
    },
    'user:f2028356-1fd8-4bf1-b55b-611993223966': {
      bet: 190,
    },
    'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3': {
      bet: 193,
    },
    'user:b5aa24e7-4d02-4420-9dd6-752dd508a306': {
      bet: 230,
    },
  },
  pot: 800,
  sidePot: [
    { id: 'user:04c4a68e-a638-427e-be30-1763ca219270', sum: 187 },
    { id: 'user:f2028356-1fd8-4bf1-b55b-611993223966', sum: 190 },
    { id: 'user:b5aa24e7-4d02-4420-9dd6-752dd508a306', sum: 230 },
    { id: 'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3', sum: 193 },
  ],
  winners: [
    ['user:04c4a68e-a638-427e-be30-1763ca219270'],
    [
      'user:f2028356-1fd8-4bf1-b55b-611993223966',
      'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3',
    ],
    ['user:b5aa24e7-4d02-4420-9dd6-752dd508a306'],
  ],
} as any

export const users: UserWithOutPassword[] = [
  { id: 'user:de4d9b93-d1eb-43b6-9d94-f0deaf5445f3', name: 'normal' },
  { id: 'user:04c4a68e-a638-427e-be30-1763ca219270', name: 'blue' },
  { id: 'user:f2028356-1fd8-4bf1-b55b-611993223966', name: 'orange' },
  { id: 'user:b5aa24e7-4d02-4420-9dd6-752dd508a306', name: 'green' },
]
