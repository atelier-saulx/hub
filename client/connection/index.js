const Socket = require('./socket')

const isConnected = hub => {
  const socket = hub.socket
  const isConnected = new Promise(resolve => {
    if (hub.socket.connected) {
      resolve(true)
    } else {
      const isConnected = () => {
        resolve(true)
        socket.removeListener('open', isConnected)
      }
      socket.on('open', isConnected)
    }
  })
  return isConnected
}

const connect = (hub, url) => {
  if (hub.socket) {
    if (url !== hub.socket.url) hub.socket.changeUrl(url)
  } else {
    hub.socket = new Socket(hub, url)
  }
  return isConnected(hub)
}

exports.connect = connect
