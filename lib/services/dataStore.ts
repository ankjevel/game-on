import uuid from 'uuid'
import redis from '../adapters/redis'
import parse from '../utils/parse'

import {
  Action,
  CreateGroupInput,
  CreateUserInput,
  GetResult,
  Group,
  isAction,
  isGroup,
  isUser,
  StoreTypes,
  User,
} from '../types/dataStore'
export { StoreTypes, User, Group, CreateGroupInput, CreateUserInput, GetResult }

const client = redis()

const newId = (type: StoreTypes) => `${type}:${uuid.v4()}`

export const create = async <T extends Group | Action | User>(
  type: StoreTypes,
  format: (id: string) => T
): Promise<T> => {
  const id = newId(type)

  if (await client.get(id)) {
    return await create(type, format)
  }

  const object = format(id)

  await client.set(
    id,
    typeof object === 'string' ? object : JSON.stringify(object)
  )

  return object
}

export const update = async <T extends Group | Action | User>(
  id: T['id'],
  data: T
) => {
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
}): Promise<GetResult> => {
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
