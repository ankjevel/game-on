import { StoreTypes, ActionRunning } from 'dataStore'
import Route from 'Route'

import {
  getWrapper,
  isStoreType,
  cleanUserSummary,
} from '../services/dataStore'
import { getPublicGroups } from '../services/group'
import { nullOrEmpty, hasProp } from '../utils'

const isActionRunning = (type: string, data: any): data is ActionRunning =>
  type === 'action' && data && hasProp(data, 'turn')

export const register: Route = (app, auth) => {
  app.get(
    '/get/public-groups',
    // auth,
    async ({ query: { take = 10 } /*user*/ }, res) => {
      // if (user == null) {
      //   return res.sendStatus(401)
      // }

      res.send(await getPublicGroups({ take }))
    }
  )

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

      if (isActionRunning(maybeType, data) && data.round !== 4) {
        cleanUserSummary(data.turn, user)
      }

      res.send(data)
    }
  )
}
