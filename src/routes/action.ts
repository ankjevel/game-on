import { NewAction } from 'dataStore'
import Route from 'Route'

import { nullOrEmpty, hasProp, isNumber } from '../utils'
import * as actionService from '../services/action'
import * as dataStore from '../services/dataStore'

const input = {
  type(input: NewAction): MaybeUndefined<NewAction['type']> {
    return hasProp(input, 'type') && dataStore.isNewActionType(input.type)
      ? input.type
      : undefined
  },

  value(input: NewAction): MaybeUndefined<NewAction['value']> {
    return hasProp(input, 'value') && isNumber(input.value)
      ? input.value
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
      }

      if (!dataStore.isNewAction(action, true)) {
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
