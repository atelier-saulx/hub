const { WebSocketServer } = require('@clusterws/cws')
const Client = require('./client')

const createServer = (port, endpoints) => {
  const router =
    typeof endpoints === 'function'
      ? endpoints
      : (client, msg) => {
          const token = msg.user_jwt || msg.token || msg.jwt
          if (token) {
            if (client.token !== token) {
              client.token = token
              client.userInfo = false
            }
          }
          const endpoint = endpoints[msg.endpoint]
          if (endpoint) {
            const method = endpoint[msg.method]
            if (method) {
              method(client, msg)
            }
          }
        }

  const server = new WebSocketServer({ port }, () => {
    console.log('🤩  hub-server listening on port:', port)
  })

  server.on('connection', (socket, upgReq) => {
    const client = new Client(socket)
    client.address = socket._socket

    socket.on('message', msg => {
      const messages = JSON.parse(msg)
      messages.forEach(msg => router(client, msg))
    })

    socket.on('close', (code, reason) => {
      client.closed = true
      client.closeAll()
    })

    // emitted on error
    socket.on('error', err => {
      console.log('oops something wrong', err)
    })

    // emitted when pong comes back from the client connection
    socket.on('pong', () => {
      // make sure to add below line (important to do not drop connections)
      socket.isAlive = true
    })

    // emitted when get ping from the server (if you send)
    socket.on('ping', () => {})

    // this function accepts string or binary (node buffer)
    // socket.send(message)

    // destroy connection
    // socket.terminate()

    // close connection
    // socket.close(code, reason)

    // to manually send ping to the client
    // socket.ping()
  })

  server.startAutoPing(20000, false)

  return server

  // server.broadcast(message, options)
  // server.close(callback)
}

module.exports = createServer
