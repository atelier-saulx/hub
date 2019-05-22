const { emit, emitImmediate } = require('./emit')
const { deepNotEqual, mergeObj } = require('./util')

const emitChange = (hub, listeners, value, props, prev, immediate) => {
  if (typeof value !== typeof prev) {
    if (immediate) {
      emitImmediate(hub, listeners, value, props, prev)
    } else {
      emit(hub, listeners, value, props, prev)
    }
    return true
  } else if (value && typeof value === 'object') {
    if (deepNotEqual(value, prev)) {
      if (immediate) {
        emitImmediate(hub, listeners, value, props, prev)
      } else {
        emit(hub, listeners, value, props, prev)
      }
      return true
    }
  } else if (value !== prev) {
    if (immediate) {
      emitImmediate(hub, listeners, value, props, prev)
    } else {
      emit(hub, listeners, value, props, prev)
    }
    return true
  }
}

const setLocal = (hub, props, value, immediate) => {
  if (props.transform) {
    value = props.transform(hub, value)
  }

  const store = props.store
  const listeners = store.listeners
  if (listeners) {
    const prev = store.v
    store.v = value
    emitChange(hub, listeners, value, props, prev, immediate)
  } else {
    store.v = value
  }
  return props
}

const mergeLocal = (hub, props, value, immediate) => {
  if (props.transform) {
    value = props.transform(hub, value)
  }

  const store = props.store
  let isUpdated
  const prev = store.v === void 0 ? props.default : store.v
  if (typeof value === 'object' && prev && typeof prev === 'object') {
    isUpdated = mergeObj(prev, value, true)
    value = prev
  }
  const listeners = store.listeners
  if (listeners) {
    store.v = value
    if (isUpdated === void 0) {
      emitChange(hub, listeners, value, props, prev, immediate)
    } else if (isUpdated === true) {
      if (immediate) {
        emitImmediate(hub, listeners, value, props, prev)
      } else {
        emit(hub, listeners, value, props, prev)
      }
    }
  } else {
    store.v = value
  }
  return props
}

const removeLocal = (hub, props, value, immediate) => {
  console.log('Remove - not implemented yet...')
}

exports.removeLocal = removeLocal
exports.setLocal = setLocal
exports.mergeLocal = mergeLocal
