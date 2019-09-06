import { hasProp, looksLikeEmail, isNumber, nullOrEmpty } from '../utils'
import {
  Action,
  IActionRunning,
  Group,
  User,
  UserWithOutPassword,
  GetResult,
  KeyValue,
} from 'dataStore'

export type Types = Action | Group | User

export enum StoreTypes {
  Action = 'action',
  Group = 'group',
  User = 'user',
  ActionRunning = 'action:running',
}

export type ActionRunning = IActionRunning<NewAction, UserSummary>

export enum NewActionEnum {
  None = 'none',
  Check = 'check',
  Call = 'call',
  Raise = 'raise',
  AllIn = 'allIn',
  Fold = 'fold',

  Back = 'back',
  Bank = 'bank',
  Join = 'join',
  Leave = 'leave',
  SittingOut = 'sittingOut',
}

export type NewAction = {
  type: NewActionEnum
  value?: number
}

export type UserSummary = {
  bet: number
  status: NewActionEnum
}

export const isUserSummary = (any: any): any is UserSummary => {
  if (
    any == null ||
    !hasProp<any>(any, 'bet') ||
    !isNumber(any.bet) ||
    !hasProp<any>(any, 'status')
  ) {
    return false
  }

  switch (any.status) {
    case NewActionEnum.None:
    case NewActionEnum.Check:
    case NewActionEnum.Call:
    case NewActionEnum.Raise:
    case NewActionEnum.AllIn:
    case NewActionEnum.Fold:
      return true
    default:
      return false
  }
}

export const isNewActionType = (any: any): any is NewActionEnum =>
  Object.values(NewActionEnum).includes(any)

export const isNewAction = (
  any: NewAction | unknown,
  strict = false
): any is NewAction => {
  if (
    !hasProp<NewAction>(any, 'type') ||
    !isNewActionType((any as any).type) ||
    (hasProp<NewAction>(any, 'value') && any.value != null
      ? !isNumber((any as any).value)
      : false)
  ) {
    return false
  }

  if (!strict) {
    return true
  }

  switch (any.type) {
    case NewActionEnum.None:
    case NewActionEnum.AllIn:
    case NewActionEnum.Back:
    case NewActionEnum.Call:
    case NewActionEnum.Check:
    case NewActionEnum.Fold:
    case NewActionEnum.SittingOut:
      return isNumber(any.value) === false
    default:
      return isNumber(any.value)
  }
}

export { Action, Group, User, GetResult }

export const checkId = (input: string, type: StoreTypes) =>
  input.split(':')[0] === type.split(':')[0]

export const isUser = (any: User | unknown): any is User =>
  any != null &&
  (hasProp<User>(any, 'id') &&
    !nullOrEmpty(any.id) &&
    checkId(any.id, StoreTypes.User)) &&
  (hasProp(any, 'email') &&
    !nullOrEmpty(any.email) &&
    looksLikeEmail(any.email)) &&
  (hasProp(any, 'password') && !nullOrEmpty(any.password))

export const isUserWithOutPassword = (
  any: UserWithOutPassword | unknown
): any is UserWithOutPassword =>
  any != null &&
  (hasProp<UserWithOutPassword>(any, 'id') &&
    !nullOrEmpty(any.id) &&
    checkId(any.id, StoreTypes.User)) &&
  (hasProp(any, 'email') &&
    !nullOrEmpty(any.email) &&
    looksLikeEmail(any.email))

export const isGroup = (any: Group | unknown): any is Group =>
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

export const isAction = (any: Action | unknown): any is Action =>
  any != null &&
  hasProp<Action>(any, 'id') &&
  typeof any.id === 'string' &&
  checkId(any.id, StoreTypes.Action)

export const isTurn = (
  any: KeyValue<NewActionEnum> | unknown
): any is KeyValue<NewActionEnum> =>
  any != null &&
  Object.entries(any as any).every(
    ([key, value]) => checkId(key, StoreTypes.User) && isNewAction(value)
  )

export const isActionRunning = (
  any: ActionRunning | unknown
): any is ActionRunning =>
  isAction(any) &&
  (hasProp<ActionRunning>(any, 'round') && isNumber(any.round)) &&
  (hasProp(any, 'groupID') && checkId(any.groupID, StoreTypes.Group)) &&
  (hasProp(any, 'queued') && isTurn(any.queued)) &&
  (hasProp(any, 'turn') &&
    Object.entries(any.turn).every(
      ([key, value]) => checkId(key, StoreTypes.User) && isUserSummary(value)
    )) &&
  (hasProp(any, 'button') && checkId(any.button, StoreTypes.User)) &&
  (hasProp(any, 'big') && checkId(any.big, StoreTypes.User)) &&
  (hasProp(any, 'pot') && isNumber(any.round)) &&
  (Array.isArray(any.sittingOut)
    ? any.sittingOut.every(user => checkId(user, StoreTypes.User))
    : true)
