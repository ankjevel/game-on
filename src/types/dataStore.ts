import {
  hasProp,
  looksLikeEmail,
  isNumber,
  nullOrEmpty,
  toEnum,
} from '../utils'
import {
  Action,
  IActionRunning,
  Group,
  User,
  UserWithOutPassword,
  GetResult,
  ITurn,
} from 'dataStore'

export type Types = Action | Group | User

export enum StoreTypes {
  Action = 'action',
  Group = 'group',
  User = 'user',
  ActionRunning = 'actionRunning',
}

export type ActionRunning = IActionRunning<NewAction>

export enum NewActionEnum {
  None = 'none',
  AllIn = 'allIn',
  Back = 'back',
  Bank = 'bank',
  Big = 'big',
  Call = 'call',
  Check = 'check',
  Join = 'join',
  Leave = 'leave',
  Rise = 'rise',
  SittingOut = 'sittingOut',
  Small = 'small',
}

export type NewAction = {
  type: NewActionEnum
  value?: number
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
    case NewActionEnum.Big:
    case NewActionEnum.Call:
    case NewActionEnum.Check:
    case NewActionEnum.SittingOut:
    case NewActionEnum.Small:
      return isNumber(any.value) === false
    default:
      return isNumber(any.value)
  }
}

export { Action, Group, User, GetResult }

export const checkId = (input: string, type: StoreTypes) =>
  input.split(':')[0] === type

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
  any: ITurn<NewActionEnum> | unknown
): any is ITurn<NewActionEnum> =>
  any != null &&
  Object.entries(any as any).every(
    ([key, value]) => checkId(key, StoreTypes.User) && isNewAction(value)
  )

export const isActionRunning = (
  any: ActionRunning | unknown
): any is ActionRunning =>
  isAction(any) &&
  (hasProp<ActionRunning>(any, 'round') && isNumber(any.round)) &&
  (hasProp(any, 'grupID') && checkId(any.grupID, StoreTypes.Group)) &&
  (hasProp(any, 'queued') && isTurn(any.queued)) &&
  (hasProp(any, 'turn') && any.turn.every(turn => isTurn(turn))) &&
  (hasProp(any, 'button') && checkId(any.button, StoreTypes.User)) &&
  (hasProp(any, 'big') && checkId(any.big, StoreTypes.User)) &&
  (hasProp(any, 'pot') && isNumber(any.round)) &&
  (hasProp(any, 'folded') &&
    Array.isArray(any.folded) &&
    any.folded.every(fold => checkId(fold, StoreTypes.User))) &&
  (Array.isArray(any.sittingOut)
    ? any.sittingOut.every(user => checkId(user, StoreTypes.User))
    : true) &&
  (Array.isArray(any.history)
    ? any.history.every(turn => isTurn(turn))
    : true) &&
  (Array.isArray(any.bust)
    ? any.bust.every(user => checkId(user, StoreTypes.User))
    : true)
