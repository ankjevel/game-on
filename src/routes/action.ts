import Route from 'Route'
import { nullOrEmpty, hasProp, isNumber, toEnum } from '../utils'
import * as actionService from '../services/action'
import {
  NewAction,
  NewActionEnum,
  isNewAction,
  checkId,
  StoreTypes,
} from '../types/dataStore'

const input = {
  type(input: NewAction): MaybeUndefined<NewAction['type']> {
    return hasProp(input, 'type') && toEnum(input.type, NewActionEnum) != null
      ? input.type
      : undefined
  },

  value(input: NewAction): MaybeUndefined<NewAction['value']> {
    return hasProp(input, 'value') && isNumber(input.value)
      ? input.value
      : undefined
  },

  order(input: NewAction): MaybeUndefined<NewAction['order']> {
    return hasProp(input, 'order') &&
      Array.isArray(input.order) &&
      input.order.every(winner => checkId(winner, StoreTypes.User))
      ? input.order
      : undefined
  },
}

export const register: Route = (app, auth) => {
  app.post(
    '/action/:id/:group',
    auth,
    async ({ params: { id, group }, body, user }, res) => {
      if (
        user == null ||
        nullOrEmpty(id) ||
        nullOrEmpty(group) ||
        !Object.keys(body).length
      ) {
        return res.sendStatus(400)
      }

      const action = {
        type: input.type(body),
        value: input.value(body),
        order: input.order(body),
      }

      if (!isNewAction(action, true)) {
        return res.sendStatus(400)
      }

      await actionService.newAction({
        actionID: id,
        groupID: group,
        userID: user.id,
        newAction: action,
      })

      res.sendStatus(200)
    }
  )
}
