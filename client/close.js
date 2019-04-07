const {
  removeListener,
  removeSetListener,
  removeComponentListener
} = require('./listeners')

const close = (hub, props, cb) => {
  if (!cb) {
    cb = props.onChange
  }
  if (cb) {
    if (props.fromHook) {
      removeSetListener(hub, props, cb)
    } else {
      if (typeof cb === 'object') {
        removeComponentListener(hub, props, cb)
      }
      removeListener(hub, props, cb)
    }
  } else {
    removeListener(hub, props)
  }
  if (hub.socket) {
    if (!cb) {
      hub.socket.closeAll(props)
    } else {
      hub.socket.close(props)
    }
  }
}

exports.close = close
