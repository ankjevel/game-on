import { Application } from 'express'
import { readdirSync, lstatSync } from 'fs'
import { join, basename } from 'path'
import { packageJSON } from '../config'

export default (app: Application) => {
  app.get('/', (_req, res) => res.send(packageJSON))
  app.get('/favicon.ico', (_req, res) => res.status(404).send(null))

  for (const file of readdirSync(__dirname)) {
    const path = join(__dirname, file)

    if (path === __filename) {
      continue
    }

    if (
      lstatSync(path).isFile() === false ||
      basename(path).match(/\.[jt]s$/i) == null
    ) {
      continue
    }

    try {
      const required = require(path) as {
        register?: (app: Application) => void
      }

      if (!required || required.register == null) {
        continue
      }

      required.register(app)
    } catch (error) {
      console.error(error)
    }
  }
}
