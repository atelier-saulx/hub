class Endpoint {
  constructor() {
    this.subscriptions = new Map()
  }
  emitListeners(type) {
    if (this.listeners && this.listeners[type]) {
      this.listeners[type].forEach(fn => fn(this))
    }
  }
  removeListener(type, cb) {
    console.log('removeListener not implemented yet..')
  }
  on(type, cb) {
    if (!this.listeners) {
      this.listeners = {}
    }
    if (!this.listeners[type]) {
      this.listeners[type] = []
    }
    this.listeners[type].push(cb)
  }
  emit(fn, payload) {
    this.subscriptions.forEach((subs, client) => {
      subs.forEach(msg => fn(this, client, msg, payload))
    })
  }
}

module.exports = Endpoint
