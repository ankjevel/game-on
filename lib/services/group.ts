import { CreateGroupInput, Group } from 'dataStore'
import { create, StoreTypes } from './dataStore'

export const newGroup = async ({
  name = '',
  startSum = 1000,
}: CreateGroupInput): Promise<Group> => {
  const group = await create<Group>(StoreTypes.Group, id => {
    return { id, name, startSum, users: [] }
  })

  return group
}
