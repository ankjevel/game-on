import { StoreTypes } from 'dataStore'
import Route from 'Route'

import { getWrapper, isStoreType } from '../services/dataStore'
import { nullOrEmpty } from '../utils'

export const register: Route = app => {
  app.get(
    '/get/:id/:type',
    async ({ params: { id, type: maybeType } }, res) => {
      if (nullOrEmpty(id) || nullOrEmpty(maybeType)) {
        return res.sendStatus(400)
      }

      const type: MaybeNull<StoreTypes> = isStoreType(maybeType)
        ? maybeType
        : null

      if (type == null) {
        return res.sendStatus(400)
      }

      const data = await getWrapper({
        id,
        type,
        exclude: ['password'],
      })

      if (data == null) {
        return res.sendStatus(404)
      }

      res.send(data)
    }
  )
}
