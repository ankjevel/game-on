import { CreateUserInput, User } from 'dataStore'
import { create, StoreTypes } from './dataStore'

export const newUser = async ({ name }: CreateUserInput): Promise<User> => {
  const group = await create<User>(StoreTypes.User, id => {
    return { id, name }
  })

  return group
}
