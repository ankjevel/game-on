import Route from 'Route'

import { sign } from 'jsonwebtoken'

import * as userService from '../services/user'
import { nullOrEmpty } from '../utils'
import config from '../config'

const {
  jwt: { secret, expire: expiresIn },
} = config

export const register: Route = (app, auth) => {
  app.post('/user', async ({ body: { name, p1, p2 } }, res) => {
    if (nullOrEmpty(p1) || nullOrEmpty(name) || p1 !== p2 || p1.length < 8) {
      return res.sendStatus(400)
    }

    let user
    try {
      user = await userService.newUser({ name, password: p1 })
    } catch (error) {
      console.error(error)
      return res.sendStatus(409)
    }

    const token = sign(user, secret, { expiresIn })

    res.setHeader('Authorization', `Bearer ${token}`)
    res.send(token)
  })

  app.post('/user/token', async ({ body: { id, name, password } }, res) => {
    if (nullOrEmpty(password) || (nullOrEmpty(name) && nullOrEmpty(id))) {
      return res.sendStatus(401)
    }

    try {
      const user = await userService.checkAuthAndReturnUser({
        id,
        name,
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

  app.get('/user/valid-token', auth, async ({ user }, res) => {
    if (user == null || (await userService.validUser(user)) === false) {
      return res.sendStatus(400)
    }

    return res.send({
      status: 'ok',
    })
  })

  app.get('/user/group', auth, async ({ user }, res) => {
    if (user == null) {
      return res.sendStatus(400)
    }

    try {
      const group = await userService.getGroup(user.id)
      res.send(group)
    } catch (error) {
      console.error(error)
      return res.sendStatus(400)
    }
  })
}
