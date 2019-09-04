import * as dataStore from '../services/dataStore'
import { StoreTypes } from '../types/dataStore'
import toEnum from '../utils/toEnum'
import Route from 'Route'

export const register: Route = app => {
  app.get(
    '/get/:id/:type',
    async ({ params: { id, type: maybeType } }, res) => {
      const type = toEnum<StoreTypes>(maybeType, StoreTypes)

      if (type == null) {
        return res.sendStatus(400)
      }

      res.send(await dataStore.getWrapper({ id, type }))
    }
  )
}
