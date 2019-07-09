const uws = require('../uWebSockets.js/uws')
const Client = require('./client')

const createServer = (
  port,
  endpoints,
  ua,
  onConnection,
  key,
  cert,
  debug,
  json
) =>
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
          maxPayloadLength: 1024 * 1024 * 5, // 5mb should be more then enough
          idleTimeout: 100,
          compression: 1,
          message: (socket, message) => {
            let messages
            try {
              const decoded = enc.decode(message)
              if (debug) {
                console.log('INCOMING', socket._debugId, decoded)
              }
              if (decoded === '1') {
                if (debug) {
                  console.log('PING FROM CLIENT', socket._debugId)
                }
              } else {
                try {
                  messages = JSON.parse(decoded)
                } catch (err) {
                  if (debug) {
                    console.log('ERROR PARSING JSON', socket._debugId, err)
                  }
                }
              }
            } catch (err) {
              if (debug) {
                console.log('ERROR DECODING INCOMING', socket._debugId, err)
              }
            }
            if (messages && Array.isArray(messages)) {
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
              socket._debugId = Math.floor(Math.random() * 9999999).toString(16)
              console.log('CONNECT CLIENT', socket._debugId)
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
              console.log('--------> REMOVE CLIENT', socket._debugId)
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
          if (json) {
          } else {
            res.end('')
          }
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
