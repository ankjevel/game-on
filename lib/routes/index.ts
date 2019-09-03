import { Application } from 'express'
import { packageJSON } from '../config'
import * as dataStore from '../services/dataStore'

import * as groupService from '../services/group'
import { StoreTypes } from '../types/dataStore'
import hasProp from '../utils/hasProp'
import isNumber from '../utils/isNumber'
import toEnum from '../utils/toEnum'

import { push } from '../services/action'

export default (app: Application) => {
  app.get('/', (_req, res) => res.send(packageJSON))
  app.get('/favicon.ico', (_req, res) => res.status(404).send(null))

  app.get('/new', async ({ query }, res) => {
    const name: string | undefined =
      hasProp(query, 'name') && typeof query.name === 'string'
        ? query.name.substr(0, 255)
        : undefined

    const startSum: number | undefined =
      hasProp(query, 'startSum') &&
      isNumber(query.startSum) &&
      isNumber(parseInt(query.startSum))
        ? Math.max(
            0,
            Math.min(parseInt(query.startSum), Number.MAX_SAFE_INTEGER)
          )
        : undefined

    res.send(await groupService.newGroup({ name, startSum }))
  })

  app.get('/test/:message', ({ params: { message }}, res) => {
    push({ message })

    res.send(null)
  })

  app.get(
    '/get/:id/:type?',
    async ({ params: { id, type: maybeType } }, res) => {
      const type = toEnum<StoreTypes>(maybeType, StoreTypes)

      if (type != null) {
        res.send(await dataStore.get({ id, type }))
      } else {
        res.send(await dataStore.get({ id }))
      }

      console.log('result', type, id)
    }
  )
}
