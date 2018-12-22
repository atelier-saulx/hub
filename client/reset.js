const { emit } = require('./emit')

const resetEndpoint = (hub, endpoint) => {
  if (hub.store[endpoint]) {
    for (let method in hub.store[endpoint]) {
      for (let implementation in hub.store[endpoint][method]) {
        const target = hub.store[endpoint][method][implementation]
        delete hub.store[endpoint][method][implementation]
        if (target.listeners) {
          emit(hub, target.listeners, void 0, { hash: implementation }, target)
        }
      }
    }
  }
}

module.exports = (hub, endpoint) => {
  if (!endpoint) {
    for (let endpoint in hub.store) {
      resetEndpoint(hub, endpoint)
    }
  } else {
    resetEndpoint(hub, endpoint)
  }
}
