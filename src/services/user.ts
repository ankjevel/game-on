import { User, UserWithOutPassword } from 'dataStore'
import { isUser, StoreTypes } from '../types/dataStore'
import { create, all, get } from './dataStore'
import { predictable } from '../adapters/encrypt'

export const newUser = async ({
  name,
  email,
  password,
}: Pick<User, 'name' | 'email' | 'password'>): Promise<UserWithOutPassword> => {
  const user = await create<User>(StoreTypes.User, id => {
    return {
      id,
      name,
      email,
      password: `${predictable.encrypt(`${id}:${password}`)}`,
    }
  })

  delete user.password

  console.log(user.id, 'created')

  return user
}

/**
 *
 * @param onEach Run on each saved user, if true return that result
 * @param preCheck Check that runs when gotten _all_ keys saved
 */
const checkEach = async (
  onEach: (input: User) => boolean | void,
  preCheck?: (input: string[]) => boolean | void
) => {
  let user: MaybeNull<User> = null
  const keys = await all(StoreTypes.User)

  if (preCheck && preCheck(keys)) {
    return null
  }

  for (const id of keys) {
    const res = await getUser(id)

    if (!res) {
      continue
    }

    if (onEach(res)) {
      user = res
      continue
    }
  }

  return user
}

export const checkDuplicate = async ({
  id,
  email,
}: Pick<User, 'id' | 'email'>) =>
  await checkEach(
    res => {
      if (res.email.toLowerCase() === email.toLowerCase()) {
        throw new Error(`${res.email} taken; by ${res.id}`)
      }
    },
    keys => {
      if (keys.includes(id)) {
        throw new Error(`duplicate of ${id}`)
      }
    }
  )

const getUser = async (id: User['id']): Promise<MaybeNull<User>> =>
  await get<User>({
    id,
    type: StoreTypes.User,
    check: isUser,
  })

export const checkAuthAndReturnUser = async ({
  id,
  email,
  password,
}: Pick<
  WithOptional<User, 'id' | 'email'>,
  'id' | 'email' | 'password'
>): Promise<MaybeNull<UserWithOutPassword>> => {
  let user: MaybeNull<User> = null
  if (id != null) {
    user = await getUser(id)
  }

  if (email != null) {
    user = await checkEach(
      res => res.email.toLowerCase() === email.toLowerCase()
    )
  }

  if (user == null) {
    console.log(`missing user ${id || email}`)
    return null
  }

  if (`${predictable.encrypt(`${user.id}:${password}`)}` !== user.password) {
    throw new Error(`wrong password for ${user.id} [${user.email}]`)
  }

  delete user.password

  return user
}
