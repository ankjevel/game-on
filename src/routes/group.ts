import { Route } from 'Route'
import { isNumber, hasProp, nullOrEmpty, parse } from '../utils'
import * as groupService from '../services/group'
import { UserWithOutPassword, Group } from 'dataStore'

const input = {
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

  order(query: any): MaybeNull<{ [order: string]: string }> {
    const order =
      hasProp(query, 'order') && nullOrEmpty(query.order) === false
        ? parse<{ [order: string]: string }>(query.order)
        : null

    if (
      order == null ||
      Object.keys(order).every(key => isNumber(key)) === false ||
      Object.values(order).every(
        value => !nullOrEmpty(value) && parse(value) == null
      ) === false
    ) {
      return null
    }

    return order
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
        name: input.name(query),
        startSum: input.startSum(query),
        userID: user.id,
      })
    )
  })

  app.get('/group/:id/join', auth, async ({ params: { id }, user }, res) => {
    if (user == null || input.param(id)) {
      return res.sendStatus(400)
    }

    res.send(await groupService.joinGroup({ id, userID: user.id }))
  })

  app.get(
    '/group/:id/update',
    auth,
    async ({ params: { id }, query, user }, res) => {
      if (user == null || input.param(id)) {
        return res.sendStatus(400)
      }

      res.send(
        await groupService.updateGroup({
          id,
          owner: input.owner(query, user.id),
          name: input.name(query),
          startSum: input.startSum(query),
          userID: user.id,
        })
      )
    }
  )

  app.get(
    '/group/:id/order',
    auth,
    async ({ params: { id }, query, user }, res) => {
      const order = input.order(query)

      if (user == null || input.param(id) || order == null) {
        return res.sendStatus(400)
      }

      res.send(
        await groupService.updateOrder({
          id,
          order,
          userID: user.id,
        })
      )
    }
  )
}
