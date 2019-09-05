type Check = <T>(result: MaybeNull<T>) => boolean

import uuid from 'uuid'
import * as userService from './user'
import { parse } from '../utils'
import redis from '../adapters/redis'

import {
  Action,
  GetResult,
  Group,
  isAction,
  isGroup,
  isUser,
  StoreTypes,
  Types,
  User,
} from '../types/dataStore'

export { Action, GetResult, Group, StoreTypes, Types, User, Check }

const client = redis()

export const newId = (type: StoreTypes) => `${type}:${uuid.v4()}`

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
  await client.keys(`${prefix}:*`)

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

  await client.set(
    id,
    JSON.stringify({
      ...prev,
      ...data,
    })
  )
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
}: {
  type: StoreTypes
  id: string
}): Promise<MaybeNull<T>> => {
  let check: Check

  switch (type) {
    case StoreTypes.Action:
      check = isAction
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

  return get<T>({ id, type, check })
}
