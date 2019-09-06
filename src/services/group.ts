import { UserWithOutPassword, Group, User, Action } from 'dataStore'
import { create, get, all, update, del } from './dataStore'
import { StoreTypes, isGroup } from '../types/dataStore'
import { clone } from '../utils'

const checkIfAlreadyInAGroup = async (id: UserWithOutPassword['id']) => {
  for (const key of await all(StoreTypes.Group)) {
    const res = await get<Group>({
      id: key,
      type: StoreTypes.Group,
      check: isGroup,
    })

    if (res != null && res.users.some(user => user.id === id)) {
      return true
    }
  }

  return false
}

export const newGroup = async ({
  name = '',
  startSum = 1000,
  userID,
}: WithOptional<Pick<Group, 'name' | 'startSum'>, 'name' | 'startSum'> & {
  userID: UserWithOutPassword['id']
}): Promise<MaybeNull<Group>> => {
  if (await checkIfAlreadyInAGroup(userID)) {
    return null
  }

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
  breakIfTruthy: (result: Group) => boolean,
  modify: (result: Group) => Promise<Group>
): Promise<MaybeNull<Group>> => {
  const res = await get<Group>({
    id,
    type: StoreTypes.Group,
    check: isGroup,
  })

  if (res == null || breakIfTruthy(res)) {
    return null
  }

  const modified = await modify(clone(res))

  await update(id, modified, StoreTypes.Group)

  return modified
}

export const joinGroup = async ({
  id,
  userID,
}: Pick<User, 'id'> & { userID: UserWithOutPassword['id'] }): Promise<
  MaybeNull<Group>
> => {
  if (await checkIfAlreadyInAGroup(userID)) {
    return null
  }

  return await updateWrapper(
    id,
    res => res.turn != null || res.users.some(user => user.id === userID),
    async res => {
      res.users.push({
        id: userID,
        sum: res.startSum,
      })

      return res
    }
  )
}

export const deleteGroup = async ({
  id,
  userID,
}: Pick<User, 'id'> & { userID: UserWithOutPassword['id'] }): Promise<
  MaybeNull<boolean>
> => {
  const res = await get<Group>({
    id,
    type: StoreTypes.Group,
    check: isGroup,
  })

  if (
    res == null ||
    res.owner !== userID ||
    res.users.filter(user => user.id !== userID).length !== 0
  ) {
    return null
  }

  return await del({ id, type: StoreTypes.Group })
}

export const leaveGroup = async ({
  id,
  userID,
}: Pick<User, 'id'> & { userID: UserWithOutPassword['id'] }): Promise<
  MaybeNull<Group>
> => {
  return await updateWrapper(
    id,
    res => res.turn != null || res.users.every(user => user.id !== userID),
    async res => {
      const currentIndex = res.users.findIndex(item => item.id == userID)

      if (currentIndex === -1) {
        return res
      }

      res.users.splice(currentIndex, 1)

      return res
    }
  )
}

export const updateOrder = async ({
  id,
  order,
  userID,
}: Pick<Group, 'id'> & {
  order: { [key: string]: string }
  userID: UserWithOutPassword['id']
}) => {
  return await updateWrapper(
    id,
    res => res.turn != null || res.owner !== userID,
    async res => {
      const max = res.users.length - 1
      for (const [key, id] of Object.entries(order)) {
        const newIndex = parseInt(key, 10)
        const currentIndex = res.users.findIndex(item => item.id == id)

        if (newIndex < 0 || newIndex > max || currentIndex === newIndex) {
          continue
        }

        const pop = res.users.splice(currentIndex, 1).pop()

        if (pop == null) {
          continue
        }

        res.users.splice(newIndex, 0, pop)
      }

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
}: Pick<Group, 'id'> & {
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
    async res => {
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

export const startGame = async ({
  id,
  userID,
}: Pick<Group, 'id'> & {
  userID: UserWithOutPassword['id']
}): Promise<MaybeNull<Group>> => {
  return await updateWrapper(
    id,
    res => res.turn != null || res.owner !== userID || res.users.length < 2,
    async res => {
      const action = await create<Action>(StoreTypes.Action, id => ({ id }))

      res.action = action.id

      return res
    }
  )
}
