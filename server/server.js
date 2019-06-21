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
          maxPayloadLength: 1024 * 1024, // 1mb should be enough
          idleTimeout: 100,
          compression: 1,
          message: (socket, message) => {
            let messages
            try {
              const decodedString = enc.decode(message)
              messages = JSON.parse(decodedString)
              if (debug) {
                console.log('---------> INCOMING', messages)
              }
            } catch (e) {
              console.error(e)
            }
            if (messages) {
              messages.forEach(msg => {
                if (typeof msg === 'object') {
                  if (
                    msg.endpoint === 'channel' &&
                    msg.method === 'unsubscribe'
                  ) {
                    socket.client.close(msg.channel, msg.seq)
                  } else {
                    router(socket.client, msg)
                  }
                }
              })
            }
          },
          open: (socket, req) => {
            if (debug) {
              console.log('--------> CONNECT CLIENT')
            }
            const client = new Client(socket)
            socket.client = client
            if (ua) {
              client.ua = req.getHeader('user-agent')
              // const ip = req.getHeader('x-forwarded-for')
              // if (ip) {
              // client.ipv6 = ip
              // }
            }
            if (onConnection) {
              onConnection(true, client)
            }
          },
          close: (socket, code, message) => {
            if (debug) {
              console.log('--------> REMOVE CLIENT')
            }
            socket.client.socket = null
            socket.client.closed = true
            socket.client.closeAll()
            if (onConnection) {
              onConnection(false, socket.client)
            }
            socket.client.socket = null
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
