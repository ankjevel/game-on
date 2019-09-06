import { hasProp, looksLikeEmail, isNumber, nullOrEmpty } from '../utils'
import {
  Action,
  IActionRunning,
  Group,
  User,
  UserWithOutPassword,
  GetResult,
} from 'dataStore'
export type Types = Action | Group | User
export enum StoreTypes {
  Action = 'action',
  Group = 'group',
  User = 'user',
}

export type ActionRunning = IActionRunning<Actions>

export enum ActionsEnum {
  Leave,
  Join,
  Check,
  Call,
  Rise,
  AllIn,
  Bank,
}

export type Actions = {
  type: ActionsEnum
  value?: number
}

export { Action, Group, User, GetResult }

export const checkId = (input: string, type: StoreTypes) =>
  input.split(':')[0] === type

export const isUser = (any: any): any is User => {
  return (
    any != null &&
    (hasProp<User>(any, 'id') &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.User)) &&
    (hasProp<User>(any, 'email') &&
      !nullOrEmpty(any.email) &&
      looksLikeEmail(any.email)) &&
    (hasProp<User>(any, 'password') && !nullOrEmpty(any.password))
  )
}

export const isUserWithOutPassword = (any: any): any is UserWithOutPassword => {
  return (
    any != null &&
    (hasProp<UserWithOutPassword>(any, 'id') &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.User)) &&
    (hasProp<UserWithOutPassword>(any, 'email') &&
      !nullOrEmpty(any.email) &&
      looksLikeEmail(any.email))
  )
}

export const isGroup = (any: any): any is Group => {
  return (
    any != null &&
    (hasProp<Group>(any, 'id') &&
      typeof any.id === 'string' &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.Group)) &&
    (hasProp<Group>(any, 'name') &&
      typeof any.name === 'string' &&
      !nullOrEmpty(any.name)) &&
    (hasProp<Group>(any, 'owner') &&
      typeof any.owner === 'string' &&
      !nullOrEmpty(any.owner)) &&
    (hasProp<Group>(any, 'startSum') && isNumber(any.startSum)) &&
    (hasProp<Group>(any, 'users')
      ? Array.isArray(any.users) &&
        (any.users as Group['users']).every(
          ({ id, sum }) => checkId(id, StoreTypes.User) && isNumber(sum)
        )
      : true) &&
    (hasProp(any, 'action')
      ? typeof any.action === 'string' && checkId(any.action, StoreTypes.Action)
      : true)
  )
}

export const isAction = (any: any): any is Action => {
  return (
    any != null &&
    hasProp<Action>(any, 'id') &&
    typeof any.id === 'string' &&
    checkId(any.id, StoreTypes.Action)
  )
}
