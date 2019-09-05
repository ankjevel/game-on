import { nullOrEmpty } from '../utils'
import Route from 'Route'

export const register: Route = (app, auth) => {
  app.get(
    '/action/:id/:group',
    auth,
    async ({ params: { id, group }, user }, res) => {
      if (user == null || nullOrEmpty(id) || nullOrEmpty(group)) {
        return res.sendStatus(400)
      }

      console.log({ id, group })

      res.sendStatus(200)
    }
  )
}
