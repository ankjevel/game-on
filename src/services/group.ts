import {
  ActionRunning,
  Group,
  Order,
  User,
  UserWithOutPassword,
} from 'dataStore'

import * as dataStore from './dataStore'
import { newDeck } from './cards'
import { clone } from '../utils'

const getWrapper = async (id: Group['id']) => {
  return await dataStore.get<Group>({
    id,
    type: 'group',
    check: dataStore.isGroup,
  })
}

const checkIfAlreadyInAGroup = async (id: UserWithOutPassword['id']) => {
  for (const key of await dataStore.all('group')) {
    const res = await getWrapper(key)

    if (res != null && res.users.some(user => user.id === id)) {
      return true
    }
  }

  return false
}

export const getGroupForUser = async (id: UserWithOutPassword['id']) => {
  for (const key of await dataStore.all('group')) {
    const res = await getWrapper(key)

    if (res != null && res.users.some(user => user.id === id)) {
      return res
    }
  }

  return null
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

  const group = await dataStore.create<Group>('group', id => {
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
  const res = await getWrapper(id)

  if (res == null || breakIfTruthy(res)) {
    return null
  }

  const modified = await modify(clone(res))

  await dataStore.update(id, modified, 'group')

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

  console.log(id, 'user joined', userID)

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

      res.owner = res.users.length >= 1 ? res.users[0].id : userID

      if (res.users.length === 0) {
        await dataStore.del({ id, type: 'group' })
      }

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
      // I am not proud of this part
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
        const start = startSum ? startSum : res.startSum
        update.bigBlind = bigBlind > small && bigBlind < start
      }

      if (update.smallBlind && smallBlind) {
        const big = bigBlind ? bigBlind : res.blind.big
        const start = startSum ? startSum : res.startSum
        update.smallBlind = smallBlind < big && smallBlind < start
      }

      if (update.startSum && startSum) {
        const big = bigBlind ? bigBlind : res.blind.big
        update.startSum = startSum > big
      }

      if (
        update.bigBlind &&
        update.smallBlind &&
        update.startSum &&
        bigBlind &&
        smallBlind &&
        startSum
      ) {
        if (
          bigBlind <= smallBlind ||
          (bigBlind >= startSum || smallBlind >= startSum) ||
          startSum <= bigBlind
        ) {
          update.bigBlind = false
          update.smallBlind = false
          update.startSum = false
        }
      } else if (
        update.bigBlind &&
        update.smallBlind &&
        bigBlind &&
        smallBlind
      ) {
        if (
          bigBlind <= smallBlind ||
          (bigBlind >= res.startSum || smallBlind >= res.startSum)
        ) {
          update.bigBlind = false
          update.smallBlind = false
        }
      } else if (update.bigBlind && update.startSum && bigBlind && startSum) {
        if (
          bigBlind >= startSum ||
          bigBlind <= res.blind.small ||
          startSum <= res.blind.small
        ) {
          update.bigBlind = false
          update.startSum = false
        }
      } else if (
        update.smallBlind &&
        update.startSum &&
        smallBlind &&
        startSum
      ) {
        if (
          smallBlind <= startSum ||
          smallBlind >= res.blind.big ||
          startSum <= res.blind.big
        ) {
          update.smallBlind = false
          update.startSum = false
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
      const deck = newDeck()
      const [first, smallBlind] = res.users
      const [, , bigBlind = first] = res.users

      res.users.forEach(user => {
        user.sum = res.startSum
      })

      const turn: ActionRunning['turn'] = {
        [smallBlind.id]: { bet: res.blind.small, status: 'none' },
        [bigBlind.id]: { bet: res.blind.big, status: 'none' },
      }

      res.users
        .filter(({ id }) => id !== bigBlind.id && id !== smallBlind.id)
        .forEach(user => {
          turn[user.id] = {
            bet: 0,
            status: 'none',
          }
        })

      smallBlind.sum -= res.blind.small
      bigBlind.sum -= res.blind.big

      const action = await dataStore.create<ActionRunning>('action', id => ({
        id,
        groupID: res.id,
        queued: {},
        button: smallBlind.id,
        big: bigBlind.id,
        small: smallBlind.id,
        turn,
        deck,
        communityCards: [],
        pot: res.blind.small + res.blind.big,
        round: 0,
      }))

      if (action == null) {
        throw new Error('atomic update failed')
      }

      res.action = action.id

      console.log(action.id, 'new action', res.users.map(user => user.id))

      return res
    }
  )
}
