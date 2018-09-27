exports.on = (hub, props, fn) => {
  const store = props.store
  let listeners = store.listeners
  if (!listeners) {
    listeners = store.listeners = {}
  }
  if (!listeners.fn) listeners.fn = []
  listeners.fn.push(fn)
}

const removeOnListeners = (hub, props) => {
  if (props._onListener) {
    props._onParsed.forEach(val => {
      removeListener(hub, val, props._onListener)
    })
  }
}

const removeListener = (hub, props, fn) => {
  const store = props.store
  const listeners = store.listeners
  const fnStore = listeners && listeners.fn
  removeOnListeners(hub, props)
  // props.on

  if (fnStore) {
    if (fn) {
      for (let i = 0, len = fnStore.length; i < len; i++) {
        if (fnStore[i] === fn) {
          fnStore.splice(i, 1)
          if (fnStore.length === 0) {
            delete listeners.fn
            if (!listeners.components) {
              listeners.removed = true
              delete store.listeners
            }
          }
          return true
        }
      }
    } else {
      delete listeners.fn
      if (!listeners.components) {
        listeners.removed = true
        delete store.listeners
      }
      return true
    }
  }
}

exports.removeListener = removeListener

exports.onComponent = (hub, props, component) => {
  const store = props.store
  let listeners = store.listeners
  if (!listeners) {
    listeners = store.listeners = {}
  }
  if (!listeners.components) listeners.components = { length: 0 }
  if (!listeners.components[component.uid]) {
    listeners.components.length++
    listeners.components[component.uid] = component
  }
}

exports.removeComponentListener = (hub, props, component) => {
  const store = props.store
  const listeners = store.listeners
  const componentStore = listeners && listeners.components
  removeOnListeners(hub, props)

  if (componentStore) {
    if (component) {
      const uid = component.uid
      for (let key in componentStore) {
        // eslint-disable-next-line
        if (key == uid) {
          delete componentStore[key]
          componentStore.length--
          if (componentStore.length === 0) {
            delete listeners.components
            if (!listeners.fn) {
              listeners.removed = true
              delete store.listeners
            }
          }
          return true
        }
      }
    } else {
      delete listeners.components
      if (!listeners.fn) {
        listeners.removed = true
        delete store.listeners
      }
      return true
    }
  }
}
