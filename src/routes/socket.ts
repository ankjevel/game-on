import { ActionRunning, Group, JWTUSer } from 'dataStore'

import { verify } from 'jsonwebtoken'

import { hasProp, clone } from '../utils'
import config from '../config'
import { getGroupForUser } from '../services/group'
import { subscribe } from '../services/pubsub'
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
    console.log(channel, 'hasRoom?', !!room)
    if (!room) {
      return
    }
    for (const socket of room) {
      console.log('update:group', socket.id)
      socket.emit('update:group', message)
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
      if (message.round !== 4) {
        message.turn = {}

        const user = users.get(socket.id)

        if (!user) continue

        message.turn = clone(turn)
        Object.entries(message.turn).forEach(([userID, userSummary]) => {
          if (user.id === userID) return
          delete userSummary.cards
          delete userSummary.hand
        })
      }

      socket.emit('update:action', message)
    }
  } catch (error) {
    console.error(error)
  }
})

export const join = (client: SocketIO.Socket, newRoom: Group['id']) => {
  const room = rooms.get(newRoom)
  const user = users.get(client.id)
  console.log(client.id, user)

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

export const leave = (client: SocketIO.Socket) => {
  const connection = connections.get(client.id)
  if (!connection) {
    return
  }

  const room = rooms.get(connection)
  if (!room) {
    return
  }

  for (const socket of room) {
    const user = users.get(client.id)
    if (user == null) {
      continue
    }
    socket.emit('user:left', user)
  }

  room.delete(client)

  if (room.size === 0) {
    rooms.delete(connection)
  }

  connections.delete(client.id)
}

export const listen = (io: SocketIO.Server) => {
  io.on('connection', client => {
    const { id } = client
    console.log(id, 'user connected')

    client.on('user:join', (token: string) => {
      console.log(id, 'user:join')
      const user = verify(token, config.jwt.secret) as JWTUSer
      users.set(id, {
        id: user.id,
        name: user.name,
      })
    })

    client.on('user:leave', () => {
      console.log(id, 'user:leave')
      leave(client)
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

    client.on('group:leave', () => {
      console.log(id, 'group:leave')
      leave(client)
    })

    client.on('disconnect', () => {
      console.log(id, 'user disconnected')
      leave(client)
    })
  })

  console.log('listen on socket')
}

export default listen
