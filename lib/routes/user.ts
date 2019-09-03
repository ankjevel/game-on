import { Application } from 'express'
import { sign } from 'jsonwebtoken'
import * as groupService from '../services/user'
import nullOrEmpty from '../utils/nullOrEmpty'
import looksLikeEmail from '../utils/looksLikeEmail'
import config from '../config'
import { User } from 'dataStore'

const options = { expiresIn: config.jwt.expire }

export const register = (app: Application) => {
  app.get('/user', async ({ query: { name, email } }, res) => {
    if (
      nullOrEmpty(name) ||
      nullOrEmpty(email) ||
      looksLikeEmail(email) === false
    ) {
      return res.sendStatus(400)
    }

    let user: User
    try {
      user = await groupService.newUser({ name, email })
    } catch (error) {
      console.error(error)
      return res.sendStatus(409)
    }

    const token = sign(user, config.jwt.secret, options)

    res.setHeader('Authorization', `Bearer ${token}`)

    res.send(token)
  })
}
