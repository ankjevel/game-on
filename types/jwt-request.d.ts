import * as express from 'express'
import { UserWithOutPassword } from 'dataStore'

declare global {
  namespace Express {
    interface Request {
      user?: UserWithOutPassword & {
        iat: number
        exp: number
      }
    }
  }
}
