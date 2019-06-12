const uws = require('../uWebSockets.js/uws')
const Client = require('./client')

const createServer = (port, endpoints, ua, onConnection, key, cert, debug) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const enc = new TextDecoder('utf-8')
      const router =
        typeof endpoints === 'function'
          ? endpoints
          : (client, msg) => {
              const token = msg.user_jwt || msg.token || msg.jwt
              if (client.token !== token) {
                client.token = token
                client.userInfo = false
              }
              const endpoint = endpoints[msg.endpoint]
              if (endpoint) {
                const method = endpoint[msg.method]
                if (method) {
                  method(client, msg)
                }
              }
            }

      const app =
        key && cert
          ? uws.SSLApp({
              key_file_name: key,
              cert_file_name: cert
            })
          : uws.App()

      app
        .ws('/*', {
          maxPayloadLength: 32 * 1024 * 1024,
          idleTimeout: 0,
          message: (socket, message) => {
            const decodedString = enc.decode(message)
            const messages = JSON.parse(decodedString)

            if (debug) {
              console.log('---------> INCOMING', messages)
            }

            messages.forEach(msg => {
              if (msg.endpoint === 'channel' && msg.method === 'unsubscribe') {
                socket.client.close(msg.channel, msg.seq)
              } else {
                router(socket.client, msg)
              }
            })
          },
          open: (socket, req) => {
            if (debug) {
              console.log('--------> CONNECT CLIENT')
            }
            const client = new Client(socket)
            socket.client = client
            if (ua) {
              req.forEach((k, v) => {
                if (k === 'user-agent') {
                  if (v) {
                    client.ua = v
                  }
                }
              })
            }
            if (onConnection) {
              onConnection(true, client)
            }
          },
          // drain: socket => {
          // console.log('WebSocket backpressure: ' + socket.getBufferedAmount())
          // },
          close: (socket, code, message) => {
            if (debug) {
              console.log('--------> REMOVE CLIENT')
            }

            socket.client.closed = true
            socket.client.closeAll()
            if (onConnection) {
              onConnection(false, socket.client)
            }
            socket.client = null
          }
        })
        .any('/*', (res, req) => {
          res.end('fun times')
        })
        .listen(port, listenSocket => {
          if (listenSocket) {
            console.log('💫  hub-server listening on port:', port)
            resolve(listenSocket)
          } else {
            console.log('🤮  Hub-Server error on port', port)
            reject(new Error('Cannot start server on port ' + port))
          }
        })
    }, 500)
  })

module.exports = createServer
