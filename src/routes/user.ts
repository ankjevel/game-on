import { sign } from 'jsonwebtoken'
import * as groupService from '../services/user'
import { nullOrEmpty, looksLikeEmail } from '../utils'
import config from '../config'
import { User } from 'dataStore'
import Route from 'Route'

export const register: Route = app => {
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

    const token = sign(user, config.jwt.secret, {
      expiresIn: config.jwt.expire,
    })

    res.setHeader('Authorization', `Bearer ${token}`)

    res.send(token)
  })
}
