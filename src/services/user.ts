import { User, UserWithOutPassword } from 'dataStore'

import { create, all, get, isUser } from './dataStore'
import { predictable } from '../adapters/encrypt'
import { getGroupForUser } from './group'

export const newUser = async ({
  name,
  password,
}: Pick<User, 'name' | 'password'>): Promise<UserWithOutPassword> => {
  const user = await create<User>('user', id => {
    return {
      id,
      name,
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
  const keys = await all('user')

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

export const checkDuplicate = async ({ id, name }: Pick<User, 'id' | 'name'>) =>
  await checkEach(
    res => {
      if (res.name.toLowerCase() === name.toLowerCase()) {
        throw new Error(`${res.name} taken; by ${res.id}`)
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
    type: 'user',
    check: isUser,
  })

export const checkAuthAndReturnUser = async ({
  id,
  name,
  password,
}: Pick<
  WithOptional<User, 'id' | 'name'>,
  'id' | 'name' | 'password'
>): Promise<MaybeNull<UserWithOutPassword>> => {
  let user: MaybeNull<User> = null
  if (id != null) {
    user = await getUser(id)
  }

  if (name != null) {
    user = await checkEach(res => res.name.toLowerCase() === name.toLowerCase())
  }

  if (user == null) {
    console.log(`missing user ${id || name}`)
    return null
  }

  if (`${predictable.encrypt(`${user.id}:${password}`)}` !== user.password) {
    throw new Error(`wrong password for ${user.id} [${user.name}]`)
  }

  delete user.password

  return user
}

export const validUser = async (tokenUser: UserWithOutPassword) => {
  const user = await getUser(tokenUser.id)

  if (
    user == null ||
    user.id !== tokenUser.id ||
    user.name !== tokenUser.name
  ) {
    return false
  }

  return true
}

export const getGroup = async (id: User['id']) => await getGroupForUser(id)
