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

    await groupService.joinGroup({ id, userID: user.id })

    return res.sendStatus(200)
  })
}
