/* eslint-disable */
import * as express from 'express'
import { User } from 'dataStore'

declare global {
  namespace Express {
    interface Request {
      user: User & {
        iat: number
        exp: number
      }
    }
  }
}
