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
  const store = props.store
  const prev = store.v === void 0 ? props.default : store.v
  if (typeof value === 'object' && prev && typeof prev === 'object') {
    value = mergeObj(prev, value)
  }
  const listeners = store.listeners
  if (listeners) {
    store.v = value
    // diff check can be optmized here
    emitChange(hub, listeners, value, props, prev, immediate)
  } else {
    store.v = value
  }
  return props
}

const removeLocal = (hub, props, value, immediate) => {
  console.log('remove - not implemented yet...')
}

exports.removeLocal = removeLocal
exports.setLocal = setLocal
exports.mergeLocal = mergeLocal
