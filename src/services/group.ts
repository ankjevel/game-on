import { UserWithOutPassword, Group, User } from 'dataStore'
import { StoreTypes, isGroup } from '../types/dataStore'
import { create, get, update } from './dataStore'

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

export const joinGroup = async ({
  id,
  userID,
}: Pick<User, 'id'> & { userID: UserWithOutPassword['id'] }): Promise<
  MaybeNull<Group>
> => {
  const res = await get<Group>({
    id,
    type: StoreTypes.Group,
    check: isGroup,
  })

  if (
    res == null ||
    res.users.some(user => user.id === userID) ||
    res.turn != null
  ) {
    return null
  }

  res.users.push({
    id: userID,
    sum: res.startSum,
  })

  await update(id, res, StoreTypes.Group)

  return res
}

export const changeOwner = async ({
  id,
  newOwner,
  userID,
}: Pick<User, 'id'> & {
  userID: UserWithOutPassword['id']
  newOwner: UserWithOutPassword['id']
}): Promise<MaybeNull<Group>> => {
  const res = await get<Group>({
    id,
    type: StoreTypes.Group,
    check: isGroup,
  })

  if (
    res == null ||
    res.owner !== userID ||
    res.users.find(({ id }) => id === newOwner) == null
  ) {
    return null
  }

  res.owner = newOwner

  await update(id, res, StoreTypes.Group)

  return res
}
