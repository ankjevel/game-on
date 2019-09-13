type Check = <T>(result: T) => boolean

import uuid from 'uuid'
import * as userService from './user'
import { parse } from '../utils'
import redis from '../adapters/redis'
import { publish } from './pubsub'

import {
  Action,
  GetResult,
  Group,
  isAction,
  isActionRunning,
  isGroup,
  isUser,
  StoreTypes,
  Types,
  User,
} from '../types/dataStore'

export { Action, GetResult, Group, StoreTypes, Types, User, Check }

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
  console.log('should puliish', `update:${id}`)
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
    case StoreTypes.Action:
      check = isAction
      break
    case StoreTypes.ActionRunning:
      check = isActionRunning
      break
    case StoreTypes.Group:
      check = isGroup
      break
    case StoreTypes.User:
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
