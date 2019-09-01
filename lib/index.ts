import express, { ErrorRequestHandler } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

import config from './config'
import routes from './routes'

const app = express()

app.use(bodyParser.json())
app.use(cors())

routes(app)

export const errorHandler: ErrorRequestHandler = (error, _req, _res, next) => {
  console.error(error.stack)
  next(error)
}

app.use(errorHandler)

export const server = app.listen(config.express, () => {
  console.log(`listening on port ${config.express.port}`)
})

export default app
