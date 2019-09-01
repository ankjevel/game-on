import uuid from 'uuid'
import redis from '../adapters/redis'
import parse from '../utils/parse'

import { StoreTypes, Group, CreateInput, GetResult } from '../types/dataStore'
export { StoreTypes, Group, CreateInput, GetResult }

const client = redis()

const newId = (type: StoreTypes) => `${type}:${uuid.v4()}`

const createNewId = async (type: StoreTypes): Promise<string> => {
  const id = newId(type)

  if (await client.get(id)) {
    return await createNewId(type)
  }

  await client.set(id, '')

  return id
}

export const create = async (
  query: CreateInput
): Promise<
  //Group
  any
> => {
  console.log(query)
  // const userId = await createNewId(StoreTypes.User)
  // const groupId = await createNewId(StoreTypes.Group)

  // const data = {
  // 	id: groupId,
  // 	users: [userId],
  // }

  // client.set(groupId, JSON.stringify(data))

  // return data
}

export const update = () => {}


export const get = async ({
  type,
  id,
}: {
  type?: StoreTypes
  id: string
}): Promise<GetResult> => {
  const result = await client.get(id.includes(':') ? id : `${type}:${id}`)

  if (result === null) {
    return null
  }

  if (type === 'user' || id.includes(StoreTypes.User)) {
    return result
  }

  try {
    return parse<Group>(result)
  } catch (error) {
    console.error(result, error)
    return null
  }
}
