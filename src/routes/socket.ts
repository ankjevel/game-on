import { verify } from 'jsonwebtoken'
import { hasProp } from '../utils'
import config from '../config'
import { getGroupForUser } from '../services/group'
import { JWTUSer, Group } from 'dataStore'
import { subscribe } from '../services/pubsub'

const connections: Map<SocketIO.Socket['id'], Group['id']> = new Map()
const rooms: Map<Group['id'], Set<SocketIO.Socket>> = new Map()
const users: Map<
  SocketIO.Socket['id'],
  { id: JWTUSer['id']; name: JWTUSer['name'] }
> = new Map()

subscribe('update:group:*', event => {
  const channel = event.channel.replace('update:', '')
  try {
    const message = JSON.parse(event.message)
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

export const join = (client: SocketIO.Socket, newRoom: Group['id']) => {
  const room = rooms.get(newRoom)

  if (room) {
    for (const socket of room) {
      const user = users.get(client.id)
      if (user == null) {
        room.delete(socket)
        continue
      }
      socket.emit('user:joined', user)
    }
    room.add(client)
  } else {
    rooms.set(newRoom, new Set([client]))
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

        const user = verify(body.token, config.jwt.secret) as JWTUSer

        const group = await getGroupForUser(user.id)
        if (!group) {
          return
        }

        if (group.id !== body.id) {
          return
        }

        console.log('group:join', user.id, body.id)
        join(client, body.id)
      }
    )

    client.on('group:leave', () => {
      console.log('group:leave')
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
