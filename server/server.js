const uws = require('../uWebSockets.js/uws')
const Client = require('./client')
const pkg = require('../package.json')
const querystring = require('querystring')

const createServer = (
  port,
  endpoints,
  ua,
  onConnection,
  authorize,
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
                  return true
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

      let restHandler
      const version = 'v' + pkg.version

      if (json) {
        if (json === true) {
          json = parsed => {
            console.log(parsed)
            return true
          }
        }
        restHandler = async (res, req) => {
          try {
            let url = req.getUrl()
            let q = req.getQuery()

            let cUa = ua ? req.getHeader('user-agent') : ''
            res.onAborted(() => {
              res.aborted = true
            })
            const path = url.split('/')
            if (path.length > 2) {
              const endpoint = path[path.length - 2]
              const method = path[path.length - 1]
              const args = q ? querystring.parse(q) : void 0
              if (method && endpoint) {
                const msg = {
                  endpoint,
                  args,
                  method,
                  seq: 1,
                  noSubscription: true
                }

                if (json(msg)) {
                  const s = {
                    getRemoteAddress: () => {
                      return res.getRemoteAddress()
                    },
                    send: reply => {
                      res.end(reply)
                    }
                  }
                  const client = new Client(s)
                  if (ua) {
                    client.ua = cUa
                  }
                  if (!router(client, msg)) {
                    res.end('cannot find endpoint')
                  }
                } else {
                  res.end('not a valid endpoint for json')
                }
              } else {
                res.end(version)
              }
            } else {
              res.end(version)
            }
          } catch (err) {
            if (debug) {
              console.error(err)
              res.end('error')
            }
          }
        }
      } else {
        restHandler = res => {
          res.end(version)
        }
      }

      const message = (socket, message) => {
        let messages
        if (!socket.client) {
          socket.close()
          return
        }
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
              if (msg.endpoint === 'channel' && msg.method === 'unsubscribe') {
                socket.client.close(msg.channel, msg.seq)
              } else {
                router(socket.client, msg)
              }
            }
          })
        }
      }

      const open = (socket, req) => {
        const client = new Client(socket)
        socket.client = client
        if (ua) {
          client.ua = req.getHeader('user-agent')
        }
        if (onConnection) {
          onConnection(true, client)
        }
      }

      const close = socket => {
        if (socket.client) {
          socket.client.socket = null
          socket.client.closed = true
          socket.client.closeAll()
          if (onConnection) {
            onConnection(false, socket.client)
          }
          socket.client.socket = null
          socket.client = null
        }
      }

      app
        .ws('/*', {
          maxPayloadLength: 1024 * 1024 * 5, // 5mb should be more then enough
          idleTimeout: 100,
          compression: 1,
          message,
          open: authorize
            ? async (socket, req) => {
                if (await authorize(socket, req)) {
                  return open(socket, req)
                } else {
                  socket.close()
                }
              }
            : open,
          close
        })
        .any('/*', restHandler)
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
