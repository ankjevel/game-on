import { UserWithOutPassword, Group } from 'dataStore'
import { StoreTypes, isGroup } from '../types/dataStore'
import { create, get, update } from './dataStore'

export type CreateGroupInput = {
  name?: string
  startSum?: number
  userID: UserWithOutPassword['id']
}

export type JoinGroupInput = {
  id: Group['id']
  userID: UserWithOutPassword['id']
}

export const newGroup = async ({
  name = '',
  startSum = 1000,
  userID,
}: CreateGroupInput): Promise<Group> => {
  const group = await create<Group>(StoreTypes.Group, id => {
    return {
      id,
      name,
      startSum,
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

export const joinGroup = async ({
  id,
  userID,
}: JoinGroupInput): Promise<MaybeNull<Group>> => {
  const res = await get<Group>({
    id,
    type: StoreTypes.Group,
    check: isGroup,
  })

  if (res == null) {
    return null
  }

  if (res.users.some(user => user.id === userID) || res.turn != null) {
    return null
  }

  res.users.push({
    id: userID,
    sum: res.startSum,
  })

  await update(id, res)

  console.log({ id, userID }, res)

  return res
}
