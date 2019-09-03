import { Application } from 'express'
import { packageJSON } from '../config'

import demo from './demo'
import group from './group'
import list from './list'

export default (app: Application) => {
  app.get('/', (_req, res) => res.send(packageJSON))
  app.get('/favicon.ico', (_req, res) => res.status(404).send(null))

  group(app)
  list(app)

  demo(app)
}
