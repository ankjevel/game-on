// import { subscribe } from '../services/pubsub'

export const listen = (io: SocketIO.Server) => {
  const connections: Map<string, string> = new Map()
  const rooms: Map<string, Set<string>> = new Map()

  io.on('connection', client => {
    const join = (newRoom: string) => {
      const room = rooms.get(newRoom) || new Set()
      if (room) {
        room.add(id)
      } else {
        rooms.set(newRoom, new Set([id]))
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

      room.delete(connection)
      if (room.size === 0) {
        rooms.delete(connection)
      }

      connections.delete(id)
    }

    const { id } = client

    console.log(id, 'user connected')
    client.on('group:join', room => {
      console.log('group:join', room)
      join(room)
    })

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
