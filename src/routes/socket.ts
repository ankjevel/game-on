import { ActionRunning, Group, JWTUSer } from 'dataStore'

import { verify } from 'jsonwebtoken'

import { hasProp, clone } from '../utils'
import config from '../config'
import { cleanUserSummary } from '../services/dataStore'
import { getGroupForUser } from '../services/group'
import { subscribe, publish } from '../services/pubsub'
import parse from '../utils/parse'

const connections: Map<SocketIO.Socket['id'], Group['id']> = new Map()
const rooms: Map<Group['id'], Set<SocketIO.Socket>> = new Map()
const users: Map<
  SocketIO.Socket['id'],
  { id: JWTUSer['id']; name: JWTUSer['name'] }
> = new Map()

subscribe('update:group:*', event => {
  const channel = event.channel.replace('update:', '')
  try {
    const message = parse<Group>(event.message)
    const room = rooms.get(channel)
    if (!room) {
      return
    }
    for (const socket of room) {
      socket.emit('update:group', message)
    }
  } catch (error) {
    console.error(error)
  }
})

subscribe('message:group:*', event => {
  const channel = event.channel.replace('message:', '')
  const room = rooms.get(channel)
  if (!room) {
    return
  }

  try {
    const data = parse<{
      id: string
      message: string
      userID: string
      date: string
    }>(event.message)

    if (!data || !data.id || !data.message || !data.userID || !data.date) {
      return
    }

    const { userID, message, date } = data

    for (const socket of room) {
      socket.emit('message', { message, userID, date })
    }
  } catch (error) {
    console.error(error)
  }
})

subscribe('update:action:*', event => {
  try {
    const message = parse<ActionRunning>(event.message)
    if (!message) {
      return
    }

    delete message.deck

    const channel = message.groupID
    const room = rooms.get(channel)
    if (!room) {
      return
    }

    const turn = clone(message.turn)
    for (const socket of room) {
      if (message.round !== 5) {
        message.turn = {}

        const user = users.get(socket.id)

        if (!user) continue

        message.turn = clone(turn)
        cleanUserSummary(message.turn, user)
      }

      socket.emit('update:action', message)
    }
  } catch (error) {
    console.error(error)
  }
})

export const join: (client: SocketIO.Socket, newRoom: Group['id']) => void = (
  client,
  newRoom
) => {
  const room = rooms.get(newRoom)
  const user = users.get(client.id)

  if (room) {
    for (const socket of room) {
      socket.emit('user:joined', user)
    }
    room.add(client)
  } else {
    const room = rooms.get(newRoom) || new Set()
    room.add(client)
    rooms.set(newRoom, room)
  }

  connections.set(client.id, newRoom)
}

export const leave: (
  client: SocketIO.Socket,
  type: 'group' | 'user'
) => void = (client, type) => {
  const groupID = connections.get(client.id)
  if (!groupID) return

  if (type === 'user') {
    connections.delete(client.id)
  }

  const room = rooms.get(groupID)
  if (!room) return
  rooms.delete(client.id)

  const user = users.get(client.id)
  if (room.size <= 1) {
    rooms.delete(groupID)
  } else {
    for (const socket of room) {
      socket.emit('user:left', user)
    }
  }

  if (type === 'user') {
    users.delete(client.id)
  }
}

export const listen = (io: SocketIO.Server) => {
  io.on('connection', client => {
    const { id } = client
    console.log(id, 'user connected')

    client.on('spectate', (id: string) => {
      console.log({ id })

      leave(client, 'user') // if spectating, remove all other listeners
    })

    client.on(
      'message',
      async (
        body: MaybeUndefined<{
          token: string
          message: string
        }>
      ) => {
        if (!body || !hasProp(body, 'message') || !hasProp(body, 'token')) {
          return
        }

        const user = verify(body.token, config.jwt.secret) as JWTUSer
        const group = await getGroupForUser(user.id)
        if (!group) {
          return
        }

        publish(
          `message:${group.id}`,
          JSON.stringify({
            id,
            message: body.message.substr(0, 255),
            userID: user.id,
            date: new Date().toISOString(),
          })
        )
      }
    )

    client.on('user:join', (token: string) => {
      console.log(id, 'user:join')
      const user = verify(token, config.jwt.secret) as JWTUSer
      users.set(id, {
        id: user.id,
        name: user.name,
      })
    })

    client.on(
      'group:join',
      async (
        body: MaybeUndefined<{
          id: string
          token: string
        }>
      ) => {
        if (!body || !hasProp(body, 'id') || !hasProp(body, 'token')) {
          return
        }
        console.log(id, 'group:join', body.id)

        const user = verify(body.token, config.jwt.secret) as JWTUSer

        const group = await getGroupForUser(user.id)
        if (!group) {
          return
        }

        if (group.id !== body.id) {
          return
        }

        join(client, body.id)
      }
    )

    client.on('user:leave', () => {
      console.log(id, 'user:leave')
      leave(client, 'user')
    })

    client.on('group:leave', () => {
      console.log(id, 'group:leave')
      leave(client, 'group')
    })

    client.on('restore', async token => {
      console.log(id, 'restore')

      const user = verify(token, config.jwt.secret) as JWTUSer
      users.set(id, {
        id: user.id,
        name: user.name,
      })

      const group = await getGroupForUser(user.id)
      if (!group) {
        return
      }

      join(client, group.id)
    })

    client.on('disconnect', () => {
      console.log(id, 'user disconnected')
      leave(client, 'user')
    })
  })

  console.log('listen on socket')
}

export default listen
