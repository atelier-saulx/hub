const murmur = require('murmurhash-native').murmurHash

const sliceRange = (data, msg, force) => {
  const receivedRange = msg.receivedRange
  const range = msg.range
  if (!receivedRange || force) {
    return [data.slice(range[0], range[1]), range]
  } else {
    let r = [void 0, void 0]
    if (range[0] < receivedRange[0]) {
      r = [range[0], receivedRange[0]]
    }
    if (range[1] > receivedRange[1]) {
      r[1] = range[1]
      if (r[0] === void 0) {
        r[0] = receivedRange[1]
      }
    }
    if (r[0] !== void 0 && r[1] !== void 0) {
      return [data.slice(r[0], r[1]), r]
    }
  }
  return [[], []]
}

class Endpoint {
  constructor() {
    this.subscriptions = new Map()
  }
  emitListeners(type, payload) {
    if (this.listeners && this.listeners[type]) {
      this.listeners[type].forEach(fn => fn(payload, this))
    }
  }
  removeListener(type, cb) {
    console.log('RemoveListener not implemented yet..')
  }
  on(type, cb, time) {
    if (!this.listeners) {
      this.listeners = {}
    }
    if (!this.listeners[type]) {
      this.listeners[type] = []
    }
    this.listeners[type].push(cb)
  }
  emit(fn, payload) {
    if (!fn) {
      fn = this.send
    }
    this.subscriptions.forEach((subs, client) => {
      subs.forEach(msg => fn(this, client, msg, payload))
    })
  }
  // data is non-stringified
  setData(data, checksum) {
    if (typeof data === 'object') {
      this.data = data
    }
    if (checksum === void 0) {
      checksum = this.generateChecksum(JSON.stringify(data))
    }
    const changed = checksum !== this.checksum
    this.checksum = checksum
    return changed
  }
  // content is allways pre-stringified
  setContent(data, checksum) {
    if (typeof data === 'object') {
      this.content = JSON.stringify(data)
    } else {
      this.content = data
    }
    if (checksum === void 0) {
      checksum = this.generateChecksum(this.content)
    }
    const changed = checksum !== this.checksum
    this.checksum = checksum
    return changed
  }
  generateChecksum(obj) {
    return murmur(obj)
  }
  sendError(error, client, msg) {
    client.sendChannel({ error }, msg, this)
  }
  removeIfEmpty(fn = this.remove, time = 2e3) {
    if (!this.timer) {
      this.timer = setTimeout(() => {
        if (!this.subscriptions.size) {
          fn.call(this)
        }
        this.timer = false
      }, time)
    }
  }
  onEmpty(fn = this.remove, time = 2e3) {
    this.on('close', () => this.deferRemove(fn, time))
  }
  send(endpoint, client, msg) {
    const rangeRequest = msg.range
    if (rangeRequest) {
      if (endpoint.data) {
        let data = endpoint.data
        if (!Array.isArray(data)) {
          if (data instanceof Set) {
            data = Array.from(data)
          } else if (data instanceof Map) {
            data = Array.from(data.values())
          } else if (data && typeof data === 'object') {
            data = Array.from(data.values())
          } else {
            endpoint.sendError(
              '🐓  When using range endpoint.data need to be an iterable',
              client,
              msg
            )
            return
          }
        }
        const checksum = endpoint.checksum
        // eslint-disable-next-line
        const hasChanged = checksum != msg.checksum
        msg.checksum = checksum
        const [content, range] = sliceRange(data, msg, hasChanged)
        const payload = {
          checksum,
          type: 'range',
          range: range,
          content
        }
        if (content.length || hasChanged) {
          client.sendChannel(payload, msg, endpoint)
        }
      } else {
        endpoint.sendError(
          '🐓  When using range endpoint needs data',
          client,
          msg
        )
      }
    } else {
      const checksum = endpoint.checksum
      // if checksum === same && no subscriber send back no change
      // eslint-disable-next-line
      if (checksum != msg.checksum) {
        msg.checksum = checksum
        const content = endpoint.content || endpoint.data
        if (content) {
          client.sendChannel(
            {
              checksum,
              type: 'new',
              content
            },
            msg,
            endpoint
          )
        }
      } else if (msg.noSubscription) {
        client.sendChannel({}, msg, endpoint)
      }
    }
  }
}

module.exports = Endpoint
