import { hasProp, looksLikeEmail, nullOrEmpty } from '../utils'
import {
  Action,
  Group,
  User,
  CreateGroupInput,
  CreateUserInput,
  GetResult,
} from 'dataStore'
export type Types = Action | Group | User
export enum StoreTypes {
  Action = 'action',
  Group = 'group',
  User = 'user',
}
export { Action, Group, User, CreateGroupInput, CreateUserInput, GetResult }

export const checkId = (input: string, type: StoreTypes) =>
  input.split(':')[0] === type

export const isUser = (any: any): any is User => {
  return (
    any != null &&
    (hasProp(any, 'id') &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.User)) &&
    (hasProp(any, 'email') &&
      !nullOrEmpty(any.email) &&
      looksLikeEmail(any.email)) &&
    (hasProp(any, 'password') && !nullOrEmpty(any.password))
  )
}

export const isGroup = (any: any): any is Group => {
  return (
    any != null &&
    (hasProp(any, 'id') &&
      typeof any.id === 'string' &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.Group)) &&
    (hasProp(any, 'users')
      ? Array.isArray(any.users) && any.users.every(value => isUser(value))
      : true) &&
    (hasProp(any, 'action') ? isAction(any.action) : true)
  )
}

export const isAction = (any: any): any is Action => {
  return (
    any != null &&
    hasProp(any, 'id') &&
    typeof any.id === 'string' &&
    checkId(any.id, StoreTypes.Action)
  )
}
