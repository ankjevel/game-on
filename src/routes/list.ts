import { StoreTypes, ActionRunning } from 'dataStore'
import Route from 'Route'

import {
  getWrapper,
  isStoreType,
  cleanUserSummary,
} from '../services/dataStore'
import { getPublicGroups } from '../services/group'
import { nullOrEmpty, hasProp, isNumber } from '../utils'

const isActionRunning = (type: string, data: any): data is ActionRunning =>
  type === 'action' && data && hasProp(data, 'turn')

export const register: Route = (app, auth) => {
  app.get('/get/public-groups', async ({ query: { take = 10 } }, res) => {
    if (nullOrEmpty(take) || isNumber(take) === false) {
      return res.sendStatus(400)
    }

    res.send(await getPublicGroups({ take: Math.max(Math.min(take, 25), 1) }))
  })

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

      if (isActionRunning(maybeType, data) && data.round !== 5) {
        cleanUserSummary(data.turn, user)
      }

      res.send(data)
    }
  )
}
