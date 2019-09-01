import { Application } from 'express'
import { packageJSON } from '../config'
import * as dataStore from '../services/dataStore'
import { StoreTypes } from '../types/dataStore'
import hasProp from '../utils/hasProp'
import isNumber from '../utils/isNumber'

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

    res.send(await dataStore.create({ name, startSum }))
  })

  app.get('/get/:id', async ({ params: { id } }, res) => {
    res.send(await dataStore.get({ id }))
  })
  app.get('/get/user/:id', async ({ params: { id } }, res) => {
    res.send(await dataStore.get({ type: StoreTypes.User, id }))
  })
  app.get('/get/group/:id', async ({ params: { id } }, res) => {
    res.send(await dataStore.get({ type: StoreTypes.Group, id }))
  })
}
