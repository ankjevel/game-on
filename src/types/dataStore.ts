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

export type ActionRunning = IActionRunning<NewAction>

export enum NewActionEnum {
  AllIn = 'allIn',
  Bank = 'bank',
  Big = 'big',
  Call = 'call',
  Check = 'check',
  Join = 'join',
  Leave = 'leave',
  Rise = 'rise',
  Small = 'small',
}

export type NewAction = {
  type: NewActionEnum
  value?: number
}

export const isNewActionType = (any: any): any is NewActionEnum =>
  Object.values(NewActionEnum).includes(any)

export const isNewAction = (any: NewAction | unknown): any is NewAction => {
  if (
    !hasProp<NewAction>(any, 'type') ||
    !isNewActionType((any as any).type) ||
    (hasProp<NewAction>(any, 'value') && any.value != null
      ? !isNumber((any as any).value)
      : false)
  ) {
    return false
  }

  switch (any.type) {
    case NewActionEnum.AllIn:
    case NewActionEnum.Big:
    case NewActionEnum.Call:
    case NewActionEnum.Check:
    case NewActionEnum.Small:
      return isNumber(any.value) === false
    default:
      return isNumber(any.value)
  }
}

export { Action, Group, User, GetResult }

export const checkId = (input: string, type: StoreTypes) =>
  input.split(':')[0] === type

export const isUser = (any: User | unknown): any is User => {
  return (
    any != null &&
    (hasProp<User>(any, 'id') &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.User)) &&
    (hasProp(any, 'email') &&
      !nullOrEmpty(any.email) &&
      looksLikeEmail(any.email)) &&
    (hasProp(any, 'password') && !nullOrEmpty(any.password))
  )
}

export const isUserWithOutPassword = (
  any: UserWithOutPassword | unknown
): any is UserWithOutPassword => {
  return (
    any != null &&
    (hasProp<UserWithOutPassword>(any, 'id') &&
      !nullOrEmpty(any.id) &&
      checkId(any.id, StoreTypes.User)) &&
    (hasProp(any, 'email') &&
      !nullOrEmpty(any.email) &&
      looksLikeEmail(any.email))
  )
}

export const isGroup = (any: Group | unknown): any is Group => {
  return (
    any != null &&
    (hasProp<Group>(any, 'id') &&
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
    (hasProp(any, 'action')
      ? typeof any.action === 'string' && checkId(any.action, StoreTypes.Action)
      : true)
  )
}

export const isAction = (any: Action | unknown): any is Action => {
  return (
    any != null &&
    hasProp<Action>(any, 'id') &&
    typeof any.id === 'string' &&
    checkId(any.id, StoreTypes.Action)
  )
}
