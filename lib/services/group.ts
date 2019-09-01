import { CreateInput, Group } from 'dataStore'
import { create, StoreTypes } from './dataStore'

export const newGroup = async ({
  name = '',
  startSum = 1000,
}: CreateInput): Promise<Group> => {
  const group = await create<Group>(StoreTypes.Group, id => ({
    id,
    name,
    startSum,
    users: []
  }))

  return group
}
