import * as dataStore from '../services/dataStore'
import { StoreTypes, isUser } from '../types/dataStore'
import { toEnum, nullOrEmpty } from '../utils'
import Route from 'Route'

export const register: Route = app => {
  app.get(
    '/get/:id/:type',
    async ({ params: { id, type: maybeType } }, res) => {
      if (nullOrEmpty(id) || nullOrEmpty(maybeType)) {
        return res.sendStatus(400)
      }

      const type = toEnum<StoreTypes>(maybeType, StoreTypes)
      if (type == null) {
        return res.sendStatus(400)
      }

      const data = await dataStore.getWrapper({ id, type })
      if (data == null) {
        return res.sendStatus(404)
      }

      if (isUser(data)) {
        delete data.password
      }

      res.send(data)
    }
  )
}
