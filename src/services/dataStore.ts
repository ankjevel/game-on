import {
  Action,
  ActionRunning,
  Check,
  Group,
  KeyValue,
  NewAction,
  NewActionEnum,
  StoreTypes,
  Types,
  User,
  UserSummary,
  UserWithOutPassword,
} from 'dataStore'

import uuid from 'uuid'
import { hasProp, isNumber, nullOrEmpty } from '../utils'
import * as userService from './user'
import { parse } from '../utils'
import redis from '../adapters/redis'
import { publish } from './pubsub'

const client = redis()

export const newId = (type: StoreTypes) => `${type.split(':')[0]}:${uuid.v4()}`
export const stripTag = (input: string) => input.split(':')[1] || ''

export const checkDuplicate = async <T extends Types>(input: T) => {
  if (isAction(input) || isGroup(input)) {
    return
  }

  if (isUser(input)) {
    return userService.checkDuplicate(input)
  }
}

export const create = async <T extends Types>(
  type: StoreTypes,
  format: (id: string) => T
): Promise<T> => {
  const id = newId(type)

  if (await client.get(id)) {
    return await create(type, format)
  }

  const object = format(id)

  await checkDuplicate<T>(object)

  await client.set(
    id,
    typeof object === 'string' ? object : JSON.stringify(object)
  )

  return object
}

export const all = async (prefix: StoreTypes) =>
  await client.keys(`${prefix.split(':')[0]}:*`)

export const update = async <T extends Types>(
  id: T['id'],
  data: T,
  type: StoreTypes
) => {
  if (id !== data.id) {
    return
  }

  const prev = await getWrapper({ id, type })
  if (prev == null) {
    return
  }

  const toSave = JSON.stringify({ ...prev, ...data })
  await client.set(id, toSave)
  await publish(`update:${id}`, toSave)
}

const getQuery = ({
  type: preType,
  id,
}: {
  type: StoreTypes
  id: string
}): MaybeNull<string> => {
  const type = preType.split(':')[0]
  const query =
    id.includes(':') === false
      ? type == null
        ? null
        : `${type}:${id}`
      : type != null && id.split(':')[0] != type
      ? null
      : id

  if (query == null || !query.startsWith(`${type}:`)) {
    return null
  }

  return query
}

export const del = async ({
  type,
  id,
}: {
  type: StoreTypes
  id: string
}): Promise<boolean> => {
  const query = getQuery({ id, type })
  if (query == null) {
    return false
  }

  await client.del(query)
  await publish(`del:${id}`, '')

  return true
}

export const get = async <T extends Types>({
  type,
  id,
  check,
}: {
  type: StoreTypes
  id: string
  check: Check
}): Promise<MaybeNull<T>> => {
  const query = getQuery({ id, type })
  if (query == null) {
    return null
  }

  const result = await client.get(query)
  if (result == null) {
    return null
  }

  try {
    const parsed = parse<T>(result)
    return check(parsed) ? parsed : null
  } catch (error) {
    console.error(result, error)
    return null
  }
}

export const getWrapper = async <T extends Types>({
  type,
  id,
  exclude = [],
}: {
  type: StoreTypes
  id: string
  exclude?: string[]
}): Promise<MaybeNull<T>> => {
  let check: Check

  switch (type) {
    case 'action':
      check = isAction
      break
    case 'action:running':
      check = isActionRunning
      break
    case 'group':
      check = isGroup
      break
    case 'user':
      check = isUser
      break
    default:
      throw new Error('missing type')
  }

  const res = await get<T>({ id, type, check })
  if (res == null) {
    return null
  }

  for (const key of exclude) {
    delete res[key]
  }

  return res
}

export const isUserSummary = (any: any): any is UserSummary =>
  any != null &&
  hasProp<any>(any, 'bet') &&
  isNumber(any.bet) &&
  hasProp<any>(any, 'status') &&
  isNewActionType((any as any).status)

export const isStoreType = (any: any): any is StoreTypes => {
  switch (any as StoreTypes) {
    case 'action':
    case 'action:running':
    case 'group':
    case 'user':
      return true
    default:
      return false
  }
}

export const isNewActionType = (any: any): any is NewActionEnum => {
  switch (any) {
    case 'allIn':
    case 'back':
    case 'bank':
    case 'bet':
    case 'call':
    case 'check':
    case 'draw':
    case 'fold':
    case 'join':
    case 'leave':
    case 'none':
    case 'raise':
    case 'sittingOut':
    case 'winner':
      return true
    default:
      return false
  }
}

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
    case 'allIn':
    case 'back':
    case 'bet':
    case 'call':
    case 'check':
    case 'fold':
    case 'none':
    case 'sittingOut':
      return isNumber(any.value) === false
    case 'draw':
    case 'winner':
      return Array.isArray(any.order)
        ? any.order.every(order =>
            order.every(winner => checkId(winner, 'user'))
          )
        : true
    default:
      return isNumber(any.value)
  }
}

export const checkId = (input: string, type: StoreTypes) =>
  input.split(':')[0] === type.split(':')[0]

export const isUser = (any: User | unknown): any is User =>
  any != null &&
  (hasProp<User>(any, 'id') &&
    !nullOrEmpty(any.id) &&
    checkId(any.id, 'user')) &&
  (hasProp(any, 'name') && !nullOrEmpty(any.name)) &&
  (hasProp(any, 'password') && !nullOrEmpty(any.password))

export const isUserWithOutPassword = (
  any: UserWithOutPassword | unknown
): any is UserWithOutPassword =>
  any != null &&
  (hasProp<UserWithOutPassword>(any, 'id') &&
    !nullOrEmpty(any.id) &&
    checkId(any.id, 'user')) &&
  (hasProp(any, 'name') && !nullOrEmpty(any.name))

export const isGroup = (any: Group | unknown): any is Group =>
  any != null &&
  (hasProp<Group>(any, 'id') &&
    typeof any.id === 'string' &&
    !nullOrEmpty(any.id) &&
    checkId(any.id, 'group')) &&
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
        ({ id, sum }) => checkId(id, 'user') && isNumber(sum)
      )
    : true) &&
  (hasProp(any, 'action')
    ? typeof any.action === 'string' && checkId(any.action, 'action')
    : true)

export const isAction = (any: Action | unknown): any is Action =>
  any != null &&
  hasProp<Action>(any, 'id') &&
  typeof any.id === 'string' &&
  checkId(any.id, 'action')

export const isTurn = (
  any: KeyValue<NewActionEnum> | unknown
): any is KeyValue<NewActionEnum> =>
  any != null &&
  Object.entries(any as any).every(
    ([key, value]) => checkId(key, 'user') && isNewAction(value)
  )

export const isActionRunning = (
  any: ActionRunning | unknown
): any is ActionRunning =>
  isAction(any) &&
  (hasProp<ActionRunning>(any, 'round') && isNumber(any.round)) &&
  (hasProp(any, 'groupID') && checkId(any.groupID, 'group')) &&
  (hasProp(any, 'queued') && isTurn(any.queued)) &&
  (hasProp(any, 'turn') &&
    Object.entries(any.turn).every(
      ([key, value]) => checkId(key, 'user') && isUserSummary(value)
    )) &&
  (hasProp(any, 'button') && checkId(any.button, 'user')) &&
  (hasProp(any, 'big') && checkId(any.big, 'user')) &&
  (hasProp(any, 'pot') && isNumber(any.round)) &&
  (Array.isArray(any.sittingOut)
    ? any.sittingOut.every(user => checkId(user, 'user'))
    : true)
