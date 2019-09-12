import { verify } from 'jsonwebtoken'
import { hasProp } from '../utils'
import config from '../config'
import { getGroupForUser } from '../services/group'
import { JWTUSer } from 'dataStore'

// import { subscribe } from '../services/pubsub'

export const listen = (io: SocketIO.Server) => {
  const connections: Map<string, string> = new Map()
  const rooms: Map<string, Set<SocketIO.Socket>> = new Map()

  io.on('connection', client => {
    const { id } = client

    const join = (newRoom: string) => {
      const room = rooms.get(newRoom) || new Set()
      if (room) {
        for (const user of room) {
          user.emit('user:joined', id)
        }
        room.add(client)
      } else {
        rooms.set(newRoom, new Set([client]))
      }
      connections.set(id, newRoom)
    }

    const leave = () => {
      const connection = connections.get(id)
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

      connections.delete(id)
    }

    console.log(id, 'user connected')
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
        join(body.id)
      }
    )

    client.on('group:leave', () => {
      console.log('group:leave')
      leave()
    })

    client.on('disconnect', () => {
      console.log(id, 'user disconnected')
      leave()
    })
  })

  console.log('listen on socket')
}

export default listen
