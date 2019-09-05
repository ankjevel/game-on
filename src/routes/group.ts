import { Route } from 'Route'
import { isNumber, hasProp, nullOrEmpty } from '../utils'
import * as groupService from '../services/group'

export const register: Route = (app, auth) => {
  app.get('/group', auth, async ({ query, user }, res) => {
    if (user == null) {
      return res.sendStatus(400)
    }

    const name: string | undefined =
      hasProp(query, 'name') &&
      typeof query.name === 'string' &&
      nullOrEmpty(query.name) === false
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

    res.send(
      await groupService.newGroup({
        name,
        startSum,
        userID: user.id,
      })
    )
  })

  app.get('/group/:id/join', auth, async ({ params: { id }, user }, res) => {
    if (user == null) {
      return res.sendStatus(400)
    }

    if (nullOrEmpty(id) || id.length > 255) {
      return res.sendStatus(400)
    }

    res.send(await groupService.joinGroup({ id, userID: user.id }))
  })

  app.get(
    '/group/:id/change-owner',
    auth,
    async ({ params: { id }, query, user }, res) => {
      if (user == null) {
        return res.sendStatus(400)
      }

      const owner =
        hasProp(query, 'owner') &&
        typeof query.owner === 'string' &&
        nullOrEmpty(query.owner) === false
          ? query.owner
          : null

      if (nullOrEmpty(id) || id.length > 255 || owner == null) {
        return res.sendStatus(400)
      }

      if (user.id === owner) {
        return res.sendStatus(409)
      }

      res.send(
        await groupService.changeOwner({ id, newOwner: owner, userID: user.id })
      )
    }
  )
}
