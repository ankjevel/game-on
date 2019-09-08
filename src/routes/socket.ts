// import { subscribe } from '../services/pubsub'

export const listen = (io: SocketIO.Server) => {
  io.on('connection', client => {
    const { id } = client
    console.log(id, 'user connected')
    client.on('disconnect', () => {
      console.log(id, 'user disconnected')
    })
  })

  console.log('listen on socket')
}

export default listen
