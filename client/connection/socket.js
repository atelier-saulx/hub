const Emitter = require('./emitter')
const connectWs = require('./websocket')
const { defaultReceive } = require('../rpc')

const handleIncoming = (socket, data) => {
  const hasChannel = data.channel !== void 0
  let seq = data.seq

  if (socket.hub.debug) {
    console.log('Incoming:', JSON.parse(JSON.stringify(data, false, 2)))
  }

  if (!seq && hasChannel && socket.resolved[data.channel]) {
    seq = socket.resolved[data.channel]
    delete socket.resolved[data.channel]
  }

  if (seq) {
    if (!socket.callbacks[seq]) {
      // console.warn(`seq lost in traffic "${seq}"`)
      return
    }
    const props = socket.callbacks[seq].props
    if (props) {
      const sub = socket.subscriptions[props.hash]
      if (hasChannel && sub) {
        const channel = data.channel
        socket.channels[channel] = props.hash
        if (
          sub.channel &&
          sub.channel !== channel &&
          socket.channels[sub.channel]
        ) {
          delete socket.channels[sub.channel]
        }
        sub.channel = channel
      }
      props.receive(socket.hub, props, data, defaultReceive)
    } else if (data.error) {
      console.error('cannot find props:', data.error)
    }
    if (socket.callbacks) {
      delete socket.callbacks[seq]
    }
  } else if (hasChannel && data.channel !== 0) {
    if (data.error) {
      // console.error(data.error)
    }
    const channelId = socket.channels[data.channel]
    if (channelId !== void 0) {
      if (!socket.subscriptions[socket.channels[data.channel]]) {
        console.error('cannot find channeld ID', data.channel, data)
      } else {
        const { props } = socket.subscriptions[socket.channels[data.channel]]
        socket.subscriptions[socket.channels[data.channel]].inProgress = false
        props.receive(socket.hub, props, data, defaultReceive)
      }
    }
  }
}

const close = socket => {
  if (socket.closed) return
  socket.channels = {}
  socket.closed = true
  for (let key in socket.subscriptions) {
    const subs = socket.subscriptions[key]
    subs.channel = void 0
    subs.inProgress = false
  }
}

const sendSubscription = (socket, force) => {
  const subs = socket.subscriptions
  for (let key in subs) {
    if (!subs[key].inProgress || force) {
      if (force && subs[key].inProgress) {
        delete socket.callbacks[subs[key].inProgress]
      }
      let channel = subs[key].channel
      subs[key].channel = void 0
      const props = subs[key].props
      const newSub = {
        endpoint: props.endpoint,
        seq: ++socket.seq,
        method: props.method,
        args: props.args
      }
      if (force && channel !== void 0) {
        newSub.channel = channel
        socket.resolved[channel] = socket.seq
      }
      if (props.store && props.store.checksum) {
        newSub.checksum = props.store.checksum
      }
      socket.queue.push(newSub)
      subs[key].inProgress = socket.seq
      socket.callbacks[socket.seq] = { props }
    }
  }
  socket.sendQueue()
}

const listen = socket => {
  socket.on('close', data => close(socket))

  socket.on('open', data => {
    if (socket.closed) socket.closed = false
    sendSubscription(socket)
  })

  socket.on('data', data => {
    if (socket.hub.globalSettings && socket.hub.globalSettings.incoming) {
      const parsed = socket.hub.globalSettings.incoming(socket.hub, data)
      if (parsed) {
        handleIncoming(socket, parsed)
      }
    } else {
      handleIncoming(socket, data)
    }
  })
}

class Socket extends Emitter {
  constructor(hub, url) {
    super()
    this.connected = false
    this.queue = []
    this.listeners = {}
    this.pending = {}
    this.callbacks = {}
    this.seq = 0
    this.queueId = 0
    this.subscriptions = {}
    this.hub = hub
    this.resolved = {}
    this.channels = {}
    listen(this)
    this.connection = connectWs({}, this, url)
  }
  changeUrl(url) {
    this.connection.closed = true
    if (this.connection.ws) {
      this.connection.ws.close()
    }
    this.connected = false
    close(this)
    this.url = url
    this.connection = connectWs({}, this, url)
  }
  sendQueue() {
    if (!this.inprogress) {
      this.inprogress = setTimeout(() => {
        if (this.connection && this.connected && this.queue.length) {
          if (this.hub.globalSettings && this.hub.globalSettings.send) {
            const send = this.hub.globalSettings.send
            const queue = []
            for (let payload of this.queue) {
              const parsed = send(this.hub, payload)
              if (parsed) {
                queue.push(parsed)
              }
            }
            if (this.hub.debug) {
              console.log('Outgoing:', queue)
            }

            this.connection.ws.send(JSON.stringify(queue))
          } else {
            if (this.hub.debug) {
              console.log('Outgoing:', this.queue)
            }

            this.connection.ws.send(JSON.stringify(this.queue))
          }
          this.queue = []
        }
        this.inprogress = false
      }, 50)
    }
  }
  resendAllSubscriptions() {
    if (this.connected) {
      sendSubscription(this, true)
    }
  }
  unsubscribe(subs, seq) {
    const payload = {
      endpoint: 'channel',
      method: 'unsubscribe'
    }

    if (seq) {
      payload.seq = seq
    }

    if (subs.channel) {
      payload.channel = subs.channel
    }

    this.queue.push(payload)
    this.sendQueue()
  }
  closeAll(props) {
    const subs = this.subscriptions[props.hash]
    if (subs) {
      if (this.connected && subs.channel && this.channels[subs.channel]) {
        delete this.channels[subs.channel]
        this.unsubscribe(subs)
      } else if (subs.inProgress) {
        delete this.callbacks[subs.inProgress]
        let removed
        for (let i = 0, l = this.queue.length; i < l; i++) {
          const q = this.queue[i]
          if (q.seq === subs.inProgress) {
            removed = true
            this.queue.splice(i, 1)
            break
          }
        }
        if (!removed) {
          this.unsubscribe(subs, subs.inProgress)
        }
      }
      delete this.subscriptions[props.hash]
    }
  }
  close(props) {
    const subs = this.subscriptions[props.hash]
    if (subs) {
      subs.cnt--
      if (subs.cnt === 0) {
        this.closeAll(props)
      }
    }
  }
  rpc(props, receive) {
    const isSubscriber = props.isSubscriber
    const hash = props.hash

    if (isSubscriber) {
      if (!this.subscriptions[hash]) {
        this.subscriptions[hash] = { props, cnt: 1, inProgress: this.seq + 1 }
      } else {
        this.subscriptions[hash].cnt++
        props.receive(this.hub, props, void 0, defaultReceive)
        return
      }
    }

    const payload = {
      endpoint: props.endpoint,
      seq: ++this.seq,
      method: props.method
    }

    if (props.args) payload.args = props.args
    if (!isSubscriber) {
      payload.noSubscription = true
    } else if (props.store.checksum) {
      payload.checksum = props.store.checksum
    }

    this.callbacks[this.seq] = { props }
    this.queue.push(payload)
    this.sendQueue()
  }
}

module.exports = Socket
