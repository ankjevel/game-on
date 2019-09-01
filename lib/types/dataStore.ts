import hasProp from '../utils/hasProp'

import { Group, CreateInput, GetResult } from 'dataStore'
export { Group, CreateInput, GetResult }

export enum StoreTypes {
  Group = 'group',
  User = 'user',
}

export const isGroup = (any: Group): any is Group =>
  hasProp(any, 'id') &&
  hasProp(any, 'users') &&
  typeof any.id === 'string' &&
  Array.isArray(any.users) &&
  any.users.every(value => typeof value === 'string')
