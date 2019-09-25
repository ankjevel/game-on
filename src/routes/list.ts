import { StoreTypes, ActionRunning } from 'dataStore'
import Route from 'Route'

import { getWrapper, isStoreType } from '../services/dataStore'
import { nullOrEmpty, hasProp } from '../utils'

const isActionRunning = (type: string, data: any): data is ActionRunning =>
  type === 'action' && data && hasProp(data, 'turn')

export const register: Route = (app, auth) => {
  app.get(
    '/get/:id/:type',
    auth,
    async ({ params: { id, type: maybeType }, user }, res) => {
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
        exclude: ['password', 'deck'],
      })

      if (data == null) {
        return res.sendStatus(404)
      }

      if (isActionRunning(maybeType, data)) {
        Object.entries(data.turn).forEach(([userID, userSummary]) => {
          if (user && user.id == userID) {
            return
          }

          delete userSummary.cards
        })
      }

      res.send(data)
    }
  )
}
