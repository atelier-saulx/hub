const { emit } = require('./emit')
const { format } = require('./format')

const resetEndpoint = (hub, endpoint) => {
  if (hub.store[endpoint]) {
    for (let method in hub.store[endpoint]) {
      for (let implementation in hub.store[endpoint][method]) {
        const store = hub.store[endpoint][method][implementation]
        const v = store.v
        store.v = void 0
        store.checksum = void 0
        if (store.listeners) {
          emit(
            hub,
            store.listeners,
            void 0,
            format(hub, {
              hash: +implementation,
              store: store,
              endpoint,
              method
            }),
            v
          )
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
