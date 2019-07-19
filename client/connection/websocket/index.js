var WebSocket
WebSocket = require('../../../uWebSockets.js/uws.js')

const urlLoader = require('./urlLoader')

const maxReconnectionTime = 3000

const connect = (holder, socket, url, time = 0, reconnect = false) => {
  if (holder.closed) {
    return holder
  }
  urlLoader(url, realUrl => {
    if (holder.closed) {
      return holder
    }
    setTimeout(() => {
      if (holder.closed) {
        return
      }
      const ws = new WebSocket(realUrl)
      holder.ws = ws // can only have one ws connection for now
      ws.on('error', () => {})
      ws.on('message', val => {
        if (holder.closed) {
          return
        }
        try {
          const parsed = JSON.parse(val)
          if (socket.listeners.data) {
            socket.listeners.data.forEach(val => val(parsed))
          }
        } catch (err) {
          console.error('cannot parse json', err)
        }
      })
      ws.on('open', () => {
        time = 100
        if (holder.closed) {
          return
        }
        if (reconnect && socket.listeners.reconnect) {
          socket.listeners.reconnect.forEach(val => val())
        }
        if (socket.listeners.open) socket.listeners.open.forEach(val => val())
        socket.connected = true
      })
      ws.on('close', () => {
        socket.connected = false
        if (holder.closed) {
          return
        }
        if (socket.listeners.close) socket.listeners.close.forEach(val => val())
        connect(
          holder,
          socket,
          url,
          Math.min((time || 200) * 1.2),
          maxReconnectionTime,
          true
        )
      })
    }, time)
  })
  return holder
}

module.exports = connect
