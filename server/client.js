var clientId = 0

const authCheck = () => {}

class Client {
  constructor(socket) {
    this.channel = 0
    this.channels = new Map()
    this.socket = socket
    this.id = ++clientId
    this.authCheck = authCheck
  }
  sendSocket(payload) {
    // optimization allowing for caching of stringified content
    if (typeof payload.content === 'string') {
      let str
      if (!payload.channel) {
        str = `{"seq":${payload.seq},"type":"${payload.type ||
          'new'}","checksum":${payload.checksum || 0},"content":${
          payload.content
        }}`
      } else {
        str = payload.seq
          ? `{"seq":${payload.seq},"type":"${payload.type ||
              'new'}","channel":${
              payload.channel
            },"checksum":${payload.checksum || 0},"content":${payload.content}}`
          : `{"channel":${payload.channel},"type":"${payload.type ||
              'new'}","checksum":${payload.checksum || 0},"content":${
              payload.content
            }}`
      }
      this.socket.send(str)
    } else {
      this.socket.send(JSON.stringify(payload))
    }
  }
  send(payload, msg) {
    payload.seq = msg.seq
    this.sendSocket(payload)
  }
  sendChannel(payload, msg, endpoint) {
    if (msg.channel) {
      payload.channel = msg.channel
      this.sendSocket(payload)
    } else {
      msg.channel = payload.channel = msg.pendingChannel
      msg.pendingChannel = 0
      payload.seq = msg.seq
      this.sendSocket(payload)
    }
  }
  closeAll() {
    this.channels.forEach(([endpoint, msg]) => {
      endpoint.subscriptions.delete(this)
      if (endpoint.listeners && endpoint.listeners.close) {
        endpoint.emitListeners('close')
      }
    })
    this.channels.clear()
  }
  close(channel) {
    const subscription = this.channels.get(channel)
    if (subscription) {
      const [endpoint, msg] = subscription
      const subs = endpoint.subscriptions.get(this)
      if (subs) {
        for (let i = 0; i < subs.length; i++) {
          if (subs[i] === msg) {
            subs.splice(i, 1)
            break
          }
        }
        if (subs.length === 0) {
          endpoint.subscriptions.delete(this)
          if (endpoint.listeners && endpoint.listeners.close) {
            endpoint.emitListeners('close')
          }
        }
      }
    }
  }
  subscribe(endpoint, msg) {
    let clientSubs = endpoint.subscriptions.get(this)
    if (!clientSubs) {
      clientSubs = []
      endpoint.subscriptions.set(this, clientSubs)
    }
    msg.pendingChannel = ++this.channel
    this.channels.set(msg.pendingChannel, [endpoint, msg])
    clientSubs.push(msg)
  }
}

module.exports = Client
