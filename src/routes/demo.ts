import { Route } from 'Route'
import { push } from '../services/action'

export const register: Route = app => {
  app.get('/test/:message', ({ params: { message } }, res) => {
    push({ message })
    res.send(null)
  })
}
