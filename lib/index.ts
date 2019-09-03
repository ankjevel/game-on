import express, { ErrorRequestHandler } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import jwt from 'express-jwt'

import config from './config'
import routes from './routes'

export const app = express()
export default app

export const errorHandler: ErrorRequestHandler = (error, _req, _res, next) => {
  console.log('this shit')
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
        if (
          headers.authorization &&
          headers.authorization.split(' ')[0] === 'Bearer'
        ) {
          return headers.authorization.split(' ')[1]
        }

        return null
      },
    })
  )
  .use(errorHandler)

routes(app)

app.on('error', () => {
  console.log('this shit')
})

export const server = app.listen(config.express, () => {
  console.log(`listening on port ${config.express.port}`)
})
