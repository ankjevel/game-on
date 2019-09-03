import { Application } from 'express'
import hasProp from '../utils/hasProp'
import isNumber from '../utils/isNumber'
import * as groupService from '../services/group'

export const register = (app: Application) => {
  app.get('/new-group', async ({ query }, res) => {
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
}
