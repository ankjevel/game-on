import hasProp from '../utils/hasProp'
import { Action, Group, User, CreateInput, GetResult } from 'dataStore'
export { Action, Group, User, CreateInput, GetResult }

export enum StoreTypes {
  Action = 'action',
  Group = 'group',
  User = 'user',
}

export const isUser = (any: any): any is User => {
  return any != null && hasProp(any, 'id')
}

export const isGroup = (any: any): any is Group => {
  return (
    any != null &&
    hasProp(any, 'id') &&
    hasProp(any, 'users') &&
    typeof any.id === 'string' &&
    Array.isArray(any.users) &&
    any.users.every(value => isUser(value)) &&
    ((hasProp(any, 'action') && isAction(any.action)) || true)
  )
}

export const isAction = (any: any): any is Action => {
  return any != null && hasProp(any, 'id') && typeof any.id === 'string'
}
