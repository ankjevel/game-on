import { UserWithOutPassword, Group, User } from 'dataStore'
import { create, get, all, update, del } from './dataStore'
import {
  StoreTypes,
  isGroup,
  ActionRunning,
  NewActionEnum,
} from '../types/dataStore'
import { clone } from '../utils'

export type Order = { [order: string]: string }

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
  smallBlind = 2,
  bigBlind = 5,
  userID,
}: WithOptional<Pick<Group, 'name' | 'startSum'>, 'name' | 'startSum'> & {
  userID: UserWithOutPassword['id']
  smallBlind?: Group['blind']['small']
  bigBlind?: Group['blind']['big']
}): Promise<MaybeNull<Group>> => {
  if (await checkIfAlreadyInAGroup(userID)) {
    return null
  }

  const group = await create<Group>(StoreTypes.Group, id => {
    return {
      id,
      name,
      startSum,
      blind: {
        small: smallBlind,
        big: bigBlind,
      },
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

  return await modified
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
    res => res.action != null || res.users.some(user => user.id === userID),
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
    res => res.action != null || res.users.every(user => user.id !== userID),
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
  order: Order
  userID: UserWithOutPassword['id']
}) => {
  return await updateWrapper(
    id,
    res => res.action != null || res.owner !== userID,
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
  smallBlind,
  bigBlind,
  owner,
  userID,
}: Pick<Group, 'id'> & {
  name: MaybeUndefined<Group['name']>
  startSum: MaybeUndefined<Group['startSum']>
  smallBlind: MaybeUndefined<Group['blind']['small']>
  bigBlind: MaybeUndefined<Group['blind']['big']>
  owner: MaybeUndefined<Group['owner']>
  userID: UserWithOutPassword['id']
}): Promise<MaybeNull<Group>> => {
  const update = {
    bigBlind: bigBlind != null,
    smallBlind: smallBlind != null,
    name: name != null,
    owner: owner != null,
    startSum: startSum != null,
  }

  return await updateWrapper(
    id,
    res => {
      if (res.action != null || res.owner !== userID) {
        return true
      }
      if (bigBlind && res.blind.big === bigBlind) {
        update.bigBlind = false
      }
      if (smallBlind && res.blind.small === smallBlind) {
        update.smallBlind = false
      }
      if (name && res.name === name) {
        update.name = false
      }
      if (owner && res.users.find(({ id }) => id === owner) == null) {
        update.owner = false
      }
      if (startSum && res.startSum === startSum) {
        update.startSum = false
      }

      if (update.bigBlind && bigBlind) {
        const small = smallBlind ? smallBlind : res.blind.small
        update.bigBlind = bigBlind > small
      }

      if (update.smallBlind && smallBlind) {
        const big = bigBlind ? bigBlind : res.blind.big
        update.smallBlind = smallBlind < big
      }

      if (update.bigBlind && update.smallBlind && bigBlind && smallBlind) {
        if (bigBlind <= smallBlind) {
          update.bigBlind = false
          update.smallBlind = false
        }
      }

      return Object.values(update).every(value => value === false)
    },
    async res => {
      if (update.bigBlind && bigBlind) {
        res.blind.big = bigBlind
      }
      if (update.smallBlind && smallBlind) {
        res.blind.small = smallBlind
      }
      if (update.name && name) {
        res.name = name
      }
      if (update.owner && owner) {
        res.owner = owner
      }
      if (update.startSum && startSum) {
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
    res => res.owner !== userID || res.users.length < 2,
    async res => {
      const [{ id: playerOne }, { id: playerTwo }] = res.users
      const action = await create<ActionRunning>(StoreTypes.Action, id => ({
        id,
        grupID: res.id,
        queued: {},
        button: playerOne,
        big: playerTwo,
        turn: [
          { [playerOne]: { type: NewActionEnum.Small } },
          { [playerTwo]: { type: NewActionEnum.Big } },
        ],
        folded: [],
        pot: res.blind.small + res.blind.big,
        round: 0,
      }))

      if (action == null) {
        throw new Error('atomic update failed')
      }

      res.action = action.id
      return res
    }
  )
}
