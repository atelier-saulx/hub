const { setLocal, mergeLocal } = require('./setLocal')
const { emit } = require('./emit')
const { close } = require('./close')
const { format } = require('./format')
const { on, onComponent } = require('./listeners')
const { getLocal } = require('./getLocal')

const defaultSend = (hub, props, receive) => {
  if (hub.socket) {
    hub.socket.rpc(props, receive)
  } else {
    receive(hub, props, void 0, defaultReceive)
  }
}

const defaultReceive = (hub, props, response) => {
  if (response === void 0) {
    if (props.ready) props.ready(getLocal(hub, props))
  } else {
    const { type = 'new', content, checksum } = response
    if (type === void 0 || content === void 0) {
      if (props.ready) props.ready(getLocal(hub, props))
    } else if (type === 'new') {
      if (props.store !== false) {
        if (response.error) {
          setLocal(hub, props, void 0)
        } else {
          if (checksum) props.store.checksum = checksum
          setLocal(hub, props, content)
        }
      }
      if (props.ready) props.ready(content)
    } else if (type === 'update') {
      if (props.store !== false) {
        if (response.error) {
          setLocal(hub, props, void 0)
        } else {
          if (checksum) props.store.checksum = checksum
          mergeLocal(hub, props, content)
        }
      }
      if (props.ready) props.ready(getLocal(hub, props))
    }
  }
}

const onSubscription = (hub, props) => {
  const listeners = props._onParsed
  const listener = p => {
    const listener = props.onChange
    close(hub, props, listener)
    props.listenening = false
    props.hash = false
    props.store = false
    if (props.call) {
      props.args = props._prevArgs
    }
    const nprops = format(hub, props)
    internalRpc(hub, nprops)
    const listeners = nprops.store.listeners
    // need to wait with this...
    emit(hub, listeners, getLocal(hub, nprops), nprops)
  }
  props._onListener = listener
  listeners.forEach(val => {
    on(hub, val, listener)
  })
}

const internalRpc = (hub, props) => {
  if (!props.receive) props.receive = defaultReceive
  if (props.send === void 0) props.send = defaultSend
  const listener = props.onChange

  if (!props.listenening && listener) {
    if (props.on) {
      onSubscription(hub, props)
    }
    if (typeof listener === 'object') {
      onComponent(hub, props, listener)
    } else {
      on(hub, props, listener)
    }
    props.listenening = true
  }

  if (props.send) {
    props.send(hub, props, props.receive, defaultSend)
  } else {
    props.receive(hub, props, void 0, defaultReceive)
  }
}

const rpc = (hub, props) => {
  // promise returns async generator if its a subscription
  return new Promise(resolve => {
    // will not be resolve in between value - if channel then
    props.ready = resolve
    internalRpc(hub, props)
  })
}

exports.defaultSend = defaultSend
exports.defaultReceive = defaultReceive
exports.internalRpc = internalRpc
exports.rpc = rpc
