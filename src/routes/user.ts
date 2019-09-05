import { sign } from 'jsonwebtoken'
import * as userService from '../services/user'
import { nullOrEmpty, looksLikeEmail } from '../utils'
import config from '../config'
import Route from 'Route'

const {
  jwt: { secret, expire: expiresIn },
} = config

export const register: Route = app => {
  app.post('/user', async ({ body: { name, email, p1, p2 } }, res) => {
    if (
      nullOrEmpty(p1) ||
      nullOrEmpty(name) ||
      nullOrEmpty(email) ||
      looksLikeEmail(email) === false ||
      p1 !== p2 ||
      p1.length < 8
    ) {
      return res.sendStatus(400)
    }

    let user
    try {
      user = await userService.newUser({ name, email, password: p1 })
    } catch (error) {
      console.error(error)
      return res.sendStatus(409)
    }

    const token = sign(user, secret, { expiresIn })

    res.setHeader('Authorization', `Bearer ${token}`)
    res.send(token)
  })

  app.post('/user/token', async ({ body: { id, email, password } }, res) => {
    if (nullOrEmpty(password) || (nullOrEmpty(email) && nullOrEmpty(id))) {
      return res.sendStatus(401)
    }

    try {
      const user = await userService.checkAuthAndReturnUser({
        id,
        email,
        password,
      })

      if (user == null) {
        return res.sendStatus(401)
      }

      const token = sign(user, secret, { expiresIn })

      res.setHeader('Authorization', `Bearer ${token}`)
      res.send(token)
    } catch (error) {
      console.log(error)
      res.sendStatus(401)
    }
  })
}
