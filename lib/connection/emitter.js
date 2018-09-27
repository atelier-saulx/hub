class Emitter {
  constructor() {
    this.listeners = {}
  }
  emit(type, val) {
    if (this.listeners[type]) this.listeners[type].forEach(fn => fn(val))
  }
  on(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(fn)
  }
  removeListener(type, fn) {
    const listeners = this.listeners[type]
    if (listeners) {
      if (!fn) {
        delete this.listeners[type]
      } else {
        for (let i = 0, len = listeners.length; i < len; i++) {
          if (listeners[i] === fn) {
            listeners.splice(i, 1)
            break
          }
        }
      }
    }
  }
}

module.exports = Emitter
