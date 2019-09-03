import { Application } from 'express'
import * as dataStore from '../services/dataStore'
import { StoreTypes } from '../types/dataStore'
import toEnum from '../utils/toEnum'

export default (app: Application) => {
  app.get(
    '/get/:id/:type?',
    async ({ params: { id, type: maybeType } }, res) => {
      const type = toEnum<StoreTypes>(maybeType, StoreTypes)

      if (type != null) {
        res.send(await dataStore.get({ id, type }))
      } else {
        res.send(await dataStore.get({ id }))
      }
    }
  )
}
