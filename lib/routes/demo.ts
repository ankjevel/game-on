import { Application } from 'express'
import { push } from '../services/action'

export const register = (app: Application) => {
  app.get('/test/:message', ({ params: { message } }, res) => {
    push({ message })
    res.send(null)
  })
}
