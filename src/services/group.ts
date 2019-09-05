import { UserWithOutPassword, Group, User } from 'dataStore'
import { create, get, update } from './dataStore'
import { StoreTypes, isGroup } from '../types/dataStore'
import { clone } from '../utils'

export const newGroup = async ({
  name = '',
  startSum = 1000,
  userID,
}: WithOptional<Pick<Group, 'name' | 'startSum'>, 'name' | 'startSum'> & {
  userID: UserWithOutPassword['id']
}): Promise<Group> => {
  const group = await create<Group>(StoreTypes.Group, id => {
    return {
      id,
      name,
      startSum,
      owner: userID,
      users: [
        {
          id: userID,
          sum: startSum,
        },
      ],
    }
  })

  return group
}

const updateWrapper = async (
  id: User['id'],
  isInvalid: (result: Group) => boolean,
  modify: (result: Group) => Group
): Promise<MaybeNull<Group>> => {
  const res = await get<Group>({
    id,
    type: StoreTypes.Group,
    check: isGroup,
  })

  if (res == null) {
    return null
  }

  if (isInvalid(res)) {
    return null
  }

  const modified = modify(clone(res))

  await update(id, modified, StoreTypes.Group)

  return modified
}

export const joinGroup = async ({
  id,
  userID,
}: Pick<User, 'id'> & { userID: UserWithOutPassword['id'] }): Promise<
  MaybeNull<Group>
> => {
  return await updateWrapper(
    id,
    res => res.turn != null || res.users.some(user => user.id === userID),
    res => {
      res.users.push({
        id: userID,
        sum: res.startSum,
      })

      return res
    }
  )
}

export const updateGroup = async ({
  id,
  name,
  startSum,
  owner,
  userID,
}: Pick<User, 'id'> & {
  name: MaybeUndefined<Group['name']>
  startSum: MaybeUndefined<Group['startSum']>
  owner: MaybeUndefined<Group['owner']>
  userID: UserWithOutPassword['id']
}): Promise<MaybeNull<Group>> => {
  return await updateWrapper(
    id,
    res => {
      if (res.turn != null || res.owner !== userID) {
        return true
      }

      if (owner && res.users.find(({ id }) => id === owner) == null) {
        return true
      }

      if (name && res.name === name) {
        return true
      }

      if (startSum && res.startSum === startSum) {
        return true
      }

      return false
    },
    res => {
      if (owner) {
        res.owner = owner
      }

      if (name) {
        res.name = name
      }

      if (startSum) {
        res.startSum = startSum

        res.users.forEach(user => {
          user.sum = startSum
        })
      }

      return res
    }
  )
}
