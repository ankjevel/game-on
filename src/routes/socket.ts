// import { subscribe } from '../services/pubsub'

export const listen = (io: SocketIO.Server) => {
  io.on('connection', client => {
    console.log(client)
  })

  console.log('listen on socket')
}

export default listen
