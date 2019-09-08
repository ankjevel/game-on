import express, { ErrorRequestHandler } from 'express'
import socket from 'socket.io'
import bodyParser from 'body-parser'
import cors from 'cors'
import jwt from 'express-jwt'

import config from './config'
import routes from './routes'
import { listen } from './routes/socket'
import { hasProp } from './utils'

export const app = express()
export default app

export const errorHandler: ErrorRequestHandler = (error, _req, _res, next) => {
  console.error(error.stack)
  next(error)
}

app
  .use(bodyParser.json())
  .use(cors())
  .use(
    jwt({
      credentialsRequired: false,
      secret: config.jwt.secret,
      getToken: ({ headers }) => {
        const { authorization = '' } = hasProp(headers, 'authorization')
          ? headers
          : {}

        const [type, token] = authorization.split(' ')

        if (type === 'Bearer') {
          return token
        }

        return null
      },
    })
  )
  .use(errorHandler)

routes(app)

export const server = app.listen(config.express, () => {
  console.log(`listening on port ${config.express.port}`)
})
export const io = socket(server)
export const socketListener = listen(io)
