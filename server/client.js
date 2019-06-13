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
  getIp(type) {
    let ip = this.ip || (this.socket && this.socket.getRemoteAddress())

    if (ip) {
      if (type === 'ipv6') {
        if (this.ipv6) {
          return this.ipv6
        }
        let ipv6 = ''
        new Uint8Array(ip).forEach(
          (a, i) => (ipv6 += a.toString(16) + (i % 2 && i != 15 ? ':' : ''))
        )
        this.ipv6 = ipv6
        return ipv6
      } else if (type) {
        return Buffer.from(ip).toString(type)
      } else {
        return ip
      }
    } else {
      return ''
    }
  }
  sendChannel(payload, msg) {
    if (msg.channel) {
      payload.channel = msg.channel
      this.sendSocket(payload)
    } else {
      msg.channel = payload.channel = msg.pendingChannel
      msg.pendingChannel = 0
      payload.seq = msg.seq
      payload.channel = msg.channel
      this.sendSocket(payload)
    }
    if (msg.noSubscription) {
      this.close(msg.channel, msg.seq)
    }
  }
  closeAll() {
    this.channels.forEach(([endpoint]) => {
      endpoint.subscriptions.delete(this)
      if (endpoint.listeners && endpoint.listeners.close) {
        endpoint.emitListeners('close', this)
      }
    })
    this.channels.clear()
  }
  subscriptions(readable) {
    return [...this.channels].map(([key, [endpoint, msg]]) => {
      if (readable) {
        return `${msg.endpoint}.${msg.method} args:${JSON.stringify(
          msg.args || {}
        )} checksum:${msg.checksum || ''} `
      }
      return msg
    })
  }
  close(channel, seq) {
    let subscription
    if (!channel && seq) {
      for (let [, c] of this.channels) {
        if (c[1].seq === seq) {
          subscription = c
          break
        }
      }
    } else {
      subscription = this.channels.get(channel)
    }
    if (subscription) {
      const [endpoint, msg] = subscription
      const subs = endpoint.subscriptions.get(this)
      if (subs) {
        for (let i = 0; i < subs.length; i++) {
          if (subs[i] === msg) {
            const channel = msg.channel || msg.pendingChannel
            if (channel) {
              this.channels.delete(channel)
            }
            subs.splice(i, 1)
            break
          }
        }
        if (subs.length === 0) {
          endpoint.subscriptions.delete(this)
          if (endpoint.listeners && endpoint.listeners.close) {
            endpoint.emitListeners('close', this)
          }
        }
      }
    }
  }
  subscribe(endpoint, msg, dontSend) {
    let dontSubscribe
    if (!msg.channel) {
      if (msg.noSubscription) {
        dontSubscribe = true
      }

      const hasEndpoint = !dontSend && (endpoint.content || endpoint.data)
      if (!hasEndpoint) {
        dontSubscribe = false
      }

      if (!dontSubscribe) {
        let clientSubs = endpoint.subscriptions.get(this)
        if (!clientSubs) {
          clientSubs = []
          endpoint.subscriptions.set(this, clientSubs)
        }
        msg.pendingChannel = ++this.channel
        this.channels.set(msg.pendingChannel, [endpoint, msg])
        clientSubs.push(msg)
      }

      if (hasEndpoint) {
        endpoint.send(endpoint, this, msg)
      } else if (dontSubscribe) {
        dontSubscribe = false
      }
    } else {
      let clientSubs = endpoint.subscriptions.get(this)
      if (clientSubs) {
        for (let i = 0, len = clientSubs.length; i < len; i++) {
          const subs = clientSubs[i]
          if (
            subs.channel === msg.channel &&
            subs.method === msg.method &&
            subs.endpoint === msg.endpoint
          ) {
            subs.range = msg.range
            subs.receivedRange = msg.receivedRange
            if (!dontSend && (endpoint.content || endpoint.data)) {
              endpoint.send(endpoint, this, subs)
            }
          }
        }
      }
    }
  }
}

module.exports = Client
