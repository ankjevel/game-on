import { Route } from 'Route'
import { isNumber, hasProp, nullOrEmpty } from '../utils'
import * as groupService from '../services/group'
import { UserWithOutPassword, Group } from 'dataStore'

const parse = {
  name(query: any): MaybeUndefined<Group['name']> {
    return hasProp(query, 'name') &&
      typeof query.name === 'string' &&
      nullOrEmpty(query.name) === false
      ? query.name.substr(0, 255)
      : undefined
  },

  startSum(query: any): MaybeUndefined<Group['startSum']> {
    return hasProp(query, 'startSum') &&
      isNumber(query.startSum) &&
      isNumber(parseInt(query.startSum))
      ? Math.max(0, Math.min(parseInt(query.startSum), Number.MAX_SAFE_INTEGER))
      : undefined
  },

  owner(
    query: any,
    userID: UserWithOutPassword['id']
  ): MaybeUndefined<Group['owner']> {
    return hasProp(query, 'owner') &&
      typeof query.owner === 'string' &&
      nullOrEmpty(query.owner) === false &&
      userID !== query.owner
      ? query.owner
      : undefined
  },

  param(param: string) {
    return nullOrEmpty(param) || param.length > 255
  },
}

export const register: Route = (app, auth) => {
  app.get('/group', auth, async ({ query, user }, res) => {
    if (user == null) {
      return res.sendStatus(400)
    }

    res.send(
      await groupService.newGroup({
        name: parse.name(query),
        startSum: parse.startSum(query),
        userID: user.id,
      })
    )
  })

  app.get('/group/:id/join', auth, async ({ params: { id }, user }, res) => {
    if (user == null) {
      return res.sendStatus(400)
    }

    if (parse.param(id)) {
      return res.sendStatus(400)
    }

    res.send(await groupService.joinGroup({ id, userID: user.id }))
  })

  app.get(
    '/group/:id/update',
    auth,
    async ({ params: { id }, query, user }, res) => {
      if (user == null) {
        return res.sendStatus(400)
      }

      if (parse.param(id)) {
        return res.sendStatus(400)
      }

      res.send(
        await groupService.updateGroup({
          id,
          owner: parse.owner(query, user.id),
          name: parse.name(query),
          startSum: parse.startSum(query),
          userID: user.id,
        })
      )
    }
  )
}
