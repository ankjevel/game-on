import { Route } from 'Route'
import { isNumber, hasProp, nullOrEmpty, parse } from '../utils'
import * as groupService from '../services/group'
import { UserWithOutPassword, Group } from 'dataStore'

const input = {
  name(input: any): MaybeUndefined<Group['name']> {
    return hasProp<Group>(input, 'name') &&
      typeof input.name === 'string' &&
      nullOrEmpty(input.name) === false
      ? input.name.substr(0, 255)
      : undefined
  },

  startSum(input: any): MaybeUndefined<Group['startSum']> {
    return hasProp<Group>(input, 'startSum') &&
      isNumber(input.startSum) &&
      isNumber(parseInt((input as any).startSum))
      ? Math.max(
          0,
          Math.min(parseInt((input as any).startSum), Number.MAX_SAFE_INTEGER)
        )
      : undefined
  },

  owner(
    input: any,
    userID: UserWithOutPassword['id']
  ): MaybeUndefined<Group['owner']> {
    return hasProp<Group>(input, 'owner') &&
      typeof input.owner === 'string' &&
      nullOrEmpty(input.owner) === false &&
      userID !== input.owner
      ? input.owner
      : undefined
  },

  order(order: any): MaybeNull<{ [order: string]: string }> {
    if (
      order == null ||
      Object.keys(order).every(key => isNumber(key)) === false ||
      Object.values(order).every(
        value => !nullOrEmpty(value) && parse(value as string) == null
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
  app.post('/group', auth, async ({ body, user }, res) => {
    if (user == null) {
      return res.sendStatus(400)
    }

    res.send(
      await groupService.newGroup({
        name: input.name(body),
        startSum: input.startSum(body),
        userID: user.id,
      })
    )
  })

  app.put('/group/:id/join', auth, async ({ params: { id }, user }, res) => {
    if (user == null || input.param(id)) {
      return res.sendStatus(400)
    }

    const result = await groupService.joinGroup({ id, userID: user.id })

    if (result == null) {
      return res.sendStatus(400)
    }

    res.send(result)
  })

  app.delete(
    '/group/:id/leave',
    auth,
    async ({ params: { id }, user }, res) => {
      if (user == null || input.param(id)) {
        return res.sendStatus(400)
      }

      const result = await groupService.leaveGroup({ id, userID: user.id })
      if (result == null) {
        return res.sendStatus(400)
      }

      res.send({ status: `left "${result.name}"` })
    }
  )

  app.delete('/group/:id', auth, async ({ params: { id }, user }, res) => {
    if (user == null || input.param(id)) {
      return res.sendStatus(400)
    }

    const result = await groupService.deleteGroup({ id, userID: user.id })
    if (result == null) {
      return res.sendStatus(400)
    }

    res.send(result)
  })

  app.patch('/group/:id', auth, async ({ params: { id }, body, user }, res) => {
    if (user == null || input.param(id)) {
      return res.sendStatus(400)
    }

    const result = await groupService.updateGroup({
      id,
      owner: input.owner(body, user.id),
      name: input.name(body),
      startSum: input.startSum(body),
      userID: user.id,
    })

    if (result == null) {
      return res.sendStatus(400)
    }

    res.send(result)
  })

  app.patch(
    '/group/:id/order',
    auth,
    async ({ params: { id }, body, user }, res) => {
      const order = input.order(body)

      if (user == null || input.param(id) || order == null) {
        return res.sendStatus(400)
      }

      const result = await groupService.updateOrder({
        id,
        order,
        userID: user.id,
      })

      if (result == null) {
        return res.sendStatus(400)
      }

      res.send(result)
    }
  )

  app.put('/group/:id/start', auth, async ({ params: { id }, user }, res) => {
    if (user == null || input.param(id)) {
      return res.sendStatus(400)
    }

    const result = await groupService.startGame({ id, userID: user.id })

    if (result == null) {
      return res.sendStatus(400)
    }

    res.send(result)
  })
}
