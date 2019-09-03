import { CreateUserInput, User } from 'dataStore'
import { create, StoreTypes, all, get } from './dataStore'
import { isUser } from '../types/dataStore'

export const newUser = async ({
  name,
  email,
}: CreateUserInput): Promise<User> => {
  return await create<User>(StoreTypes.User, id => {
    return { id, name, email }
  })
}

export const checkDuplicate = async ({ id, email }: User) => {
  const keys = await all(StoreTypes.User)

  if (keys.includes(id)) {
    throw new Error(`duplicate of ${id}`)
  }

  for (const key of keys) {
    const res = (await get<User>({ id: key, type: StoreTypes.User, check: isUser }))

    if (!res) {
      continue
    }

    if (`${res.email}`.toLowerCase() === email.toLowerCase()) {
      throw new Error(`${res.email} taken`)
    }
  }

  console.log({ id, keys, email })
  return
}
