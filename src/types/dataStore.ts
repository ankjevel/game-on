import { hasProp, looksLikeEmail, isNumber, nullOrEmpty } from '../utils'
import { Action, Group, User, UserWithOutPassword, GetResult } from 'dataStore'
export type Types = Action | Group | User
export enum StoreTypes {
  Action = 'action',
  Group = 'group',
  User = 'user',
}
export { Action, Group, User, GetResult }

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

export const isUserWithOutPassword = (any: any): any is UserWithOutPassword => {
  return (
    any != null &&
    (hasProp(any, 'id') &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.User)) &&
    (hasProp(any, 'email') &&
      !nullOrEmpty(any.email) &&
      looksLikeEmail(any.email))
  )
}

export const isGroup = (any: any): any is Group => {
  return (
    any != null &&
    (hasProp(any, 'id') &&
      typeof any.id === 'string' &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.Group)) &&
    (hasProp(any, 'name') &&
      typeof any.name === 'string' &&
      !nullOrEmpty(any.name)) &&
    (hasProp(any, 'owner') &&
      typeof any.owner === 'string' &&
      !nullOrEmpty(any.owner)) &&
    (hasProp(any, 'startSum') && isNumber(any.startSum)) &&
    (hasProp(any, 'users')
      ? Array.isArray(any.users) &&
        (any.users as Group['users']).every(
          ({ id, sum }) => checkId(id, StoreTypes.User) && isNumber(sum)
        )
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
