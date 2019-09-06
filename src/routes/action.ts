import Route from 'Route'
import { nullOrEmpty, hasProp, isNumber } from '../utils'
import * as actionService from '../services/action'
import { Actions } from '../types/dataStore'

const input = {
  type(input: any): MaybeNull<Actions> {
    if (hasProp<Actions>(input, 'type')) {
      console.log(input.type)
    }
    return null
  },

  value(input: any): MaybeUndefined<number> {
    if (hasProp<Actions>(input, 'value') && isNumber(input.value)) {
      return input.value
    }

    return
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

      input.type(body)
      input.value(body)

      await actionService.newAction({ id, groupID: group, userID: user.id })

      res.sendStatus(200)
    }
  )
}
