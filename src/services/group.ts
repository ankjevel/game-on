import { CreateGroupInput, Group } from 'dataStore'
import { create, StoreTypes } from './dataStore'

export const newGroup = async ({
  name = '',
  startSum = 1000,
  userID,
}: CreateGroupInput): Promise<Group> => {
  const group = await create<Group>(StoreTypes.Group, id => {
    return { id, name, startSum, users: [userID] }
  })

  return group
}
