const maxReconnectionTime = 3000

const connect = (holder, socket, url, time = 0, reconnect = false) => {
  setTimeout(() => {
    const ws = new global.WebSocket(url)
    holder.ws = ws // can only have one ws connection for now
    ws.onerror = () => {}
    ws.onmessage = ({ data }) => {
      if (holder.closed) {
        return
      }
      var parsed
      try {
        parsed = JSON.parse(data)
      } catch (err) {
        console.error('cannot parse json', err, data)
      }
      if (parsed) {
        if (socket.listeners.data)
          socket.listeners.data.forEach(fn => {
            fn(parsed)
          })
      }
    }
    ws.onopen = () => {
      if (holder.closed) {
        return
      }
      time = 100
      if (reconnect && socket.listeners.reconnect) {
        socket.listeners.reconnect.forEach(fn => fn())
      }
      if (socket.listeners.open) socket.listeners.open.forEach(fn => fn())
      socket.connected = true
    }
    ws.onclose = () => {
      socket.connected = false
      if (holder.closed) {
        return
      }
      if (socket.listeners.close) socket.listeners.close.forEach(fn => fn())
      connect(
        holder,
        socket,
        url,
        Math.min((time || 200) * 1.2),
        maxReconnectionTime,
        true
      )
    }
  }, time)
  return holder
}

module.exports = connect
