const Emitter = require('./emitter')
const connectWs = require('./websocket')

const { defaultReceive } = require('../rpc')

const handleIncoming = (socket, data) => {
  const hasChannel = data.channel !== void 0
  let seq = data.seq

  if (socket.hub.debug) {
    console.log('Incoming:', JSON.parse(JSON.stringify(data)))
  }

  if (!seq && hasChannel && socket.resolved[data.channel]) {
    seq = socket.resolved[data.channel]
    delete socket.resolved[data.channel]
  }

  if (seq) {
    if (!socket.callbacks[seq]) {
      console.warn(`seq lost in traffic "${seq}"`)
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
      if (props.multiplex) {
        if (sub.on) {
          sub.on.forEach(props => {
            props.receive(socket.hub, props, data, defaultReceive)
          })
        }
        if (sub.cnt === 0) {
          console.log('remove sub')
          socket.closeAll(props)
        }
      }
    } else if (data.error) {
      console.error('cannot find props:', data.error)
    }
    if (socket.callbacks) {
      delete socket.callbacks[seq]
    }
  } else if (hasChannel && data.channel !== 0) {
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

      // need to use parse for this
      const payload = socket.createPayload(props)
      payload.seq = ++socket.seq

      if (force && channel !== void 0) {
        payload.channel = channel
        socket.resolved[channel] = socket.seq
      }
      if (props.store && props.store.checksum) {
        payload.checksum = props.store.checksum
      }
      socket.queue.push(payload)
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
    socket.idleTimeout()
  })
}

/*
// can make a more efficient packing mechanism
// e.g. array and remove hash
// on connect sends a map pf endpoints / methods []
// first 8 bits
// isChannel 1 bits
// seq / channel 20 bits
// has range 1 bits
// range 20 bits 20 bits
// received range 20 bits 20 bits
// 9 + 20 + 1 + 40 + 40
// 110 bits
// vs 136 * 8 = 1088
// if args == { id } just send a string (makes it 9 bytes)
// 9 * 8  vs 18
// get to 182 bits vs  576 (rly worth it :/) (its on every msg)
*/
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
  disconnect() {
    this.connection.closed = true
    if (this.connection.ws) {
      console.log('DISCONNECT')
      this.connection.ws.close()
    }
  }
  reconnect(url) {
    if (url) {
      this.connection.closed = true
      if (this.connection.ws) {
        this.connection.ws.close()
      }
      this.url = url
      console.log('RECONNECT')
      this.connection = connectWs({}, this, url)
    }
  }
  changeUrl(url) {
    this.connection.closed = true
    if (this.connection.ws) {
      this.connection.ws.close()
    }

    if (url) {
      this.connected = false
      close(this)
      this.url = url
      this.connection = connectWs({}, this, url)
    }
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
        this.idleTimeout()
      }, 50)
    }
  }
  idleTimeout() {
    const updateTime = 60 * 1e3
    if (this.idlePing) {
      clearTimeout(this.idlePing)
    }
    this.idlePing = setTimeout(() => {
      if (this.connection && this.connected && !this.closed) {
        this.connection.ws.send(1)
      }
    }, updateTime)
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
        if (!subs.multiplex) {
          this.unsubscribe(subs)
        }
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
          if (!subs.multiplex) {
            this.unsubscribe(subs, subs.inProgress)
          }
        }
      }
      delete this.subscriptions[props.hash]
    }
  }
  close(props) {
    props.isSent = false
    const subs = this.subscriptions[props.hash]
    if (subs) {
      subs.cnt--
      if (subs.cnt === 0) {
        this.closeAll(props)
      }
    }
  }
  createPayload(props) {
    const isSubscriber = props.isSubscriber
    const payload = {
      endpoint: props.endpoint,
      method: props.method
    }
    if (props.args) payload.args = props.args
    if (props.range) {
      payload.range = props.range
      if (props.store.range) {
        payload.receivedRange = props.store.range
      }
    }

    if (props.timeout) {
      payload.needConfirmation = true
    }

    if (!isSubscriber || props.multiplex) {
      payload.noSubscription = true
    }
    if (props.store.checksum) {
      payload.checksum = props.store.checksum
    }
    props.isSent = true
    return payload
  }
  rpc(props, update) {
    const isSubscriber = props.isSubscriber || props.multiplex
    const hash = props.hash
    const sub = this.subscriptions[hash]

    if (update && props.isSent && sub) {
      const payload = this.createPayload(props)
      const inQueue = props.store.inQueue
      if (inQueue !== void 0) {
        if (
          this.queue[inQueue] &&
          (this.queue[inQueue].hash === props.hash ||
            this.queue[inQueue].seq === sub.inProgress)
        ) {
          const q = this.queue[inQueue]
          if (q.channel) {
            payload.channel = q.channel
          } else {
            payload.seq = q.seq
          }
          this.queue[inQueue] = payload
          return
        } else {
          props.store.inQueue = void 0
        }
      }

      if (sub.channel !== void 0) {
        payload.channel = sub.channel
      } else {
        payload.seq = ++this.seq
        this.callbacks[this.seq] = { props }
      }
      payload.hash = props.hash
      this.queue.push(payload)
      props.store.inQueue = this.queue.length - 1
      this.sendQueue()
      return
    }

    if (isSubscriber) {
      if (!sub) {
        this.subscriptions[hash] = {
          props,
          cnt: props.multiplex ? 0 : 1,
          inProgress: this.seq + 1
        }
        if (props.multiplex) {
          this.subscriptions[hash].multiplex = true
        }
        if (props.range) {
          props.store.inQueue = this.queue.length
        }
      } else {
        if (!props.multiplex) {
          sub.cnt++
          props.receive(this.hub, props, void 0, defaultReceive)
        } else {
          // sub.
          if (!sub.on) {
            sub.on = []
          }
          sub.on.push(props)
        }
        return
      }
    }

    const payload = this.createPayload(props)
    payload.seq = ++this.seq
    this.callbacks[this.seq] = { props }
    this.queue.push(payload)

    this.sendQueue()
  }
}

module.exports = Socket
