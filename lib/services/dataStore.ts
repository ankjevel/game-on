import uuid from 'uuid'
import redis from '../adapters/redis'
import parse from '../utils/parse'
import * as userService from './user'

import {
  Action,
  CreateGroupInput,
  CreateUserInput,
  GetResult,
  Group,
  Types,
  isAction,
  isGroup,
  isUser,
  StoreTypes,
  User,
} from '../types/dataStore'

export {
  StoreTypes,
  User,
  Group,
  CreateGroupInput,
  CreateUserInput,
  GetResult,
  Types,
}

const client = redis()

export const newId = (type: StoreTypes) => `${type}:${uuid.v4()}`

export const stripTag = (input: string) => input.split(':')[1] || ''

export const checkDuplicate = async <T extends Types>(input: T) => {
  console.log({
    input,
    isAction: isAction(input),
    isGroup: isGroup(input),
    isUser: isUser(input),
  })

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

  console.log('check')
  await checkDuplicate<T>(object)

  console.log('set')
  await client.set(
    id,
    typeof object === 'string' ? object : JSON.stringify(object)
  )

  return object
}

export const all = async (prefix: StoreTypes) =>
  (await client.keys(`${prefix}:*`)) || []

export const update = async <T extends Types>(id: T['id'], data: T) => {
  if (id !== data.id) {
    return
  }

  const prev = await get({ id })

  if (prev == null) {
    return
  }

  await client.set(id, {
    ...prev,
    ...data,
  })
}

export const get = async ({
  type,
  id,
}: {
  type?: StoreTypes
  id: string
}): Promise<Types | null> => {
  const query =
    id.includes(':') === false
      ? type == null
        ? null
        : `${type}:${id}`
      : type != null && id.split(':')[0] != type
      ? null
      : id

  if (query == null) {
    return null
  }

  const result = await client.get(query)
  if (result === null) {
    return null
  }

  try {
    if (type === StoreTypes.User || id.includes(StoreTypes.User)) {
      const parsed = parse<User>(result)
      return isUser(parsed) ? parsed : null
    }

    if (type === StoreTypes.Group || id.includes(StoreTypes.Group)) {
      const parsed = parse<Group>(result)
      return isGroup(parsed) ? parsed : null
    }

    if (type === StoreTypes.Action || id.includes(StoreTypes.Action)) {
      const parsed = parse<Action>(result)
      return isAction(parsed) ? parsed : null
    }
  } catch (error) {
    console.error(result, error)
    return null
  }

  return null
}
