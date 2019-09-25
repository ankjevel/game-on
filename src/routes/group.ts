import { Route } from 'Route'
import { UserWithOutPassword, Group, Order } from 'dataStore'

import * as utils from '../utils'
import * as groupService from '../services/group'

const returnNumber = (input: any, prop: string): MaybeUndefined<number> => {
  const seemsValid =
    utils.hasProp<any>(input, prop) &&
    utils.isNumber((input as any)[prop]) &&
    utils.isNumber(parseInt((input as any)[prop]))

  const value = seemsValid
    ? Math.max(
        0,
        Math.min(parseInt((input as any)[prop]), Number.MAX_SAFE_INTEGER)
      )
    : undefined

  return value !== 0 ? value : undefined
}

const input = {
  name(input: Group | unknown): MaybeUndefined<Group['name']> {
    const name =
      input != null &&
      utils.hasProp<Group>(input, 'name') &&
      typeof input.name === 'string' &&
      utils.nullOrEmpty(input.name) === false &&
      input.name
        .substr(0, 255)
        .trimLeft()
        .replace(/ {1,}/g, '-')
        .replace(/[^a-z0-9-åäö]/gi, '')
        .replace(/-{2,}/g, '-')
        .replace(/-$/, '')
        .toLocaleLowerCase()

    return name || undefined
  },

  startSum(input: Group | unknown): MaybeUndefined<Group['startSum']> {
    return returnNumber(input, 'startSum') as MaybeUndefined<Group['startSum']>
  },

  owner(
    input: any | Group,
    userID: UserWithOutPassword['id']
  ): MaybeUndefined<Group['owner']> {
    return utils.hasProp<Group>(input, 'owner') &&
      typeof input.owner === 'string' &&
      utils.nullOrEmpty(input.owner) === false &&
      userID !== input.owner
      ? input.owner
      : undefined
  },

  order(order?: Order): MaybeNull<Order> {
    if (
      order == null ||
      Object.keys(order).every(key => utils.isNumber(key)) === false ||
      Object.values(order).every(
        value =>
          !utils.nullOrEmpty(value) && utils.parse(value as string) == null
      ) === false
    ) {
      return null
    }

    return order
  },

  param(param: string) {
    return utils.nullOrEmpty(param) || param.length > 255
  },

  smallBlind(input: { smallBlind: any }) {
    return returnNumber(input, 'smallBlind') as MaybeUndefined<
      Group['blind']['small']
    >
  },

  bigBlind(input: { bigBlind: any }) {
    return returnNumber(input, 'bigBlind') as MaybeUndefined<
      Group['blind']['big']
    >
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
        smallBlind: input.smallBlind(body),
        bigBlind: input.bigBlind(body),
        userID: user.id,
      })
    )
  })

  app.put('/group/:id', auth, async ({ params: { id }, user }, res) => {
    if (user == null || input.param(id)) {
      return res.sendStatus(400)
    }

    const result = await groupService.joinGroup({ id, userID: user.id })

    if (result == null) {
      return res.sendStatus(400)
    }

    res.send(result)
  })

  app.delete('/group/:id', auth, async ({ params: { id }, user }, res) => {
    if (user == null || input.param(id)) {
      return res.sendStatus(400)
    }

    const result = await groupService.leaveGroup({ id, userID: user.id })
    if (result == null) {
      return res.sendStatus(400)
    }

    res.send({ status: `left "${result.name}"` })
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
      smallBlind: input.smallBlind(body),
      bigBlind: input.bigBlind(body),
      userID: user.id,
    })

    if (result == null) {
      return res.sendStatus(400)
    }

    res.send(result)
  })

  app.post(
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

  app.post('/group/:id/start', auth, async ({ params: { id }, user }, res) => {
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
