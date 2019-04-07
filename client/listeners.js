exports.on = (hub, props, fn) => {
  const store = props.store
  let listeners = store.listeners
  if (!listeners) {
    listeners = store.listeners = {}
  }
  if (!listeners.fn) listeners.fn = []
  listeners.fn.push(fn)
}

exports.onSet = (hub, props, fn) => {
  const store = props.store
  let listeners = store.listeners
  if (!listeners) {
    listeners = store.listeners = {}
  }
  if (!listeners.fnSet) listeners.fnSet = new Set()
  listeners.fnSet.add(fn)
}

const removeOnListeners = (hub, props) => {
  props._onParsed.forEach(val => {
    removeListener(hub, val, props._onListener)
  })
}

const removeListener = (hub, props, fn) => {
  const store = props.store
  const listeners = store.listeners
  const fnStore = listeners && listeners.fn
  if (props._onListener) {
    removeOnListeners(hub, props)
  }
  if (fnStore) {
    if (fn) {
      for (let i = 0, len = fnStore.length; i < len; i++) {
        if (fnStore[i] === fn) {
          fnStore.splice(i, 1)
          if (fnStore.length === 0) {
            delete listeners.fn
            if (!listeners.components && !listeners.fnSet) {
              listeners.removed = true
              delete store.listeners
            }
          }
          return true
        }
      }
    } else {
      delete listeners.fn
      if (!listeners.components && !listeners.fnSet) {
        listeners.removed = true
        delete store.listeners
      }
      return true
    }
  }
}

exports.removeListener = removeListener

const removeSetListener = (hub, props, fn) => {
  const store = props.store
  const listeners = store.listeners
  const fnSet = listeners && listeners.fnSet
  if (props._onListener) {
    removeOnListeners(hub, props)
  }
  if (fnSet) {
    if (fn) {
      fnSet.delete(fn)
      if (fnSet.size === 0) {
        if (!listeners.components && !listeners.fn) {
          listeners.removed = true
          delete store.listeners
        } else {
          delete store.fnSet
        }
      }
      return true
    } else {
      delete listeners.fnSet
      if (!listeners.components && !listeners.fn) {
        listeners.removed = true
        delete store.listeners
      }
      return true
    }
  }
}

exports.removeSetListener = removeSetListener

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
  if (props._onListener) {
    removeOnListeners(hub, props)
  }

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
            if (!listeners.fn && !listeners.fnSet) {
              listeners.removed = true
              delete store.listeners
            }
          }
          return true
        }
      }
    } else {
      delete listeners.components
      if (!listeners.fn && !listeners.fnSet) {
        listeners.removed = true
        delete store.listeners
      }
      return true
    }
  }
}
