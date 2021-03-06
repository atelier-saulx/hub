const { setLocal, applyPatch } = require('./setLocal')
const { emit } = require('./emit')
const { close } = require('./close')
const { format } = require('./format')
const { on, onComponent, onSet } = require('./listeners')
const { getLocal } = require('./getLocal')

const defaultSend = (hub, props, receive, update) => {
  if (hub.socket) {
    hub.socket.rpc(props, update)

    if (props.cacheExpires) {
      if (props.store._delete) {
        clearTimeout(props.store._delete)
        delete props.store._delete
      }
    }

    if (props.minLoadTime) {
      clearTimeout(props._minLoadTime)
      props._minLoadTime = setTimeout(() => {
        props._minLoadTime = false
        if (props._response) {
          props._response.forEach(v => {
            receive(hub, props, v, defaultReceive)
          })
          props._response = false
        } else {
          if (props.ready) props.ready(getLocal(hub, props))
        }
      }, props.minLoadTime)
    }

    if (props.timeout) {
      if (props._timer) {
        clearTimeout(props._timer)
      }
      if (props.onTimeout) {
        props._timer = setTimeout(() => {
          props._timer = false
          props.onTimeout(hub, props, receive, defaultReceive)
        }, props.timeout)
        if (props.store) {
          props.store._timer = props._timer
        }
      } else {
        props._timer = setTimeout(() => {
          props._timer = false
          receive(hub, props, void 0, defaultReceive)
        }, props.timeout)
      }
    }
  } else {
    receive(hub, props, void 0, defaultReceive)
  }
}

const defaultReceive = (hub, props, response) => {
  if (props._timer) {
    if (props.store && props.store._timer === props._timer) {
      props.store._timer = false
    }
    clearTimeout(props._timer)
    props._timer = false
  }
  if (props.store && props.store._timer) {
    clearTimeout(props.store._timer)
    props.store._timer = false
  }
  if (props._minLoadTime) {
    if (response && response.content !== void 0) {
      if (props._response) {
        props._response.push(response)
      } else {
        props._response = [response]
      }
    }
    return
  }

  if (props.cacheExpires) {
    if (props.store._delete) {
      clearTimeout(props.store._delete)
      delete props.store._delete
    }
    props.store._delete = setTimeout(() => {
      delete props.store.v
      delete props.store.checksum
      delete props.store._delete
    }, props.cacheExpires)
  }

  if (response === void 0) {
    if (props.ready) props.ready(getLocal(hub, props))
  } else {
    const { type = 'new', content, checksum, range } = response
    if (type === void 0 || content === void 0) {
      if (props.ready) {
        props.ready(getLocal(hub, props))
      }
    } else if (type === 'new') {
      if (props.store !== false) {
        if (response.error) {
          setLocal(hub, props, void 0)
        } else {
          if (checksum) props.store.checksum = checksum
          setLocal(hub, props, content)
        }
      }

      if (props.ready) {
        props.ready(content)
      }
    } else if (type === 'update') {
      let resend
      if (checksum && props.store.checksum) {
        if (props.store !== false) {
          if (response.error) {
            setLocal(hub, props, void 0)
          } else {
            props.store.checksum = checksum
            if (applyPatch(hub, props, content) === null) {
              resend = true
            }
          }
        }
      } else {
        resend = true
        console.warn(
          'Mismatching checksums from received diff',
          checksum,
          props.store.checksum
        )
        // send request for all
      }

      if (resend) {
        hub.socket.rpc(props, true, true)
      } else {
        if (props.ready) props.ready(getLocal(hub, props))
      }
    } else if (type === 'range') {
      if (props.store !== false) {
        if (response.error) {
          setLocal(hub, props, void 0)
        } else {
          if (checksum) props.store.checksum = checksum
          const changedContent = true // checksum !== props.store.checksum

          // if range is the same

          if (props.range && response.range) {
            if (response.range[1] < props.range[1]) {
              props.store.receivedLast = true
            } else if (props.store.receivedLast) {
              props.store.receivedLast = false
            }

            if (props.store.v && props.store.range) {
              const prev = props.store.v
              const rr = props.store.range
              let update

              if (range[0] < rr[0]) {
                update = true
                for (let i = 0; i < rr[0] - range[0]; i++) {
                  prev.unshift(content[i])
                }
              }
              if (range[1] + 1 > rr[1]) {
                update = true
                for (let i = rr[1] - range[0]; i < range[1] - range[0]; i++) {
                  prev.push(content[i])
                }
              }

              if (changedContent) {
                if (
                  response.range[1] < props.range[1] &&
                  response.range[0] === props.range[0] &&
                  prev
                ) {
                  // need to find if the same... blurf
                  // this needs to be refactored with using diff much better

                  for (let i = props.range[0]; i < props.range[1]; i++) {
                    if (content[i]) {
                      prev[i] = content[i]
                    } else {
                      prev.splice(i, 1)
                    }
                  }
                  update = true
                } else {
                  update = true
                  const start = rr[0] - range[0]
                  const len =
                    range[1] + 1 > rr[1] ? rr[1] - range[0] : content.length
                  if (start < 0) {
                    for (let i = 0; i < len; i++) {
                      prev[i - start] = content[i]
                    }
                  } else {
                    for (let i = start; i < len; i++) {
                      prev[i] = content[i]
                    }
                  }
                }
              }
              if (update) {
                props.store.v = prev
                emit(hub, props.store.listeners, props.store.v, props)
              }
            } else {
              props.store.v = content
              emit(hub, props.store.listeners, props.store.v, props)
            }
            if (props.store.range) {
              if (response.range[0] < props.store.range[0]) {
                props.store.range[0] = response.range[0]
              }
              if (response.range[1] > props.store.range[1]) {
                props.store.range[1] = response.range[1]
              }
            } else {
              props.store.range = response.range
            }
          }
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
    props.listening = false
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

const internalRpc = (hub, props, update) => {
  if (!props.receive) props.receive = defaultReceive
  if (props.send === void 0) props.send = defaultSend

  const listener = props.onChange
  if (!props.listening && listener) {
    if (props.on) {
      onSubscription(hub, props)
    }
    if (props.fromHook) {
      onSet(hub, props, listener)
    } else if (typeof listener === 'object') {
      onComponent(hub, props, listener)
    } else {
      on(hub, props, listener)
    }
    props.listening = true
  }

  if (props.store && props.store._delete) {
    clearTimeout(props.store._delete)
  }

  if (props.send) {
    if (props.range) {
      if (props.sendRange) {
        props.sendRange = props.range
        update = true
      }
      props.sendRange = props.range
    }
    props.send(hub, props, props.receive, defaultSend, update)
  } else {
    props.receive(hub, props, void 0, defaultReceive)
  }
}

const rpc = (hub, props, update) => {
  // update forces an outgoing rpc to keep using the same subscription / outgoing connection
  // promise returns async generator if its a subscription
  return new Promise(resolve => {
    // will not be resolve in between value - if channel then
    props.ready = resolve
    internalRpc(hub, props, update)
  })
}

exports.defaultSend = defaultSend
exports.defaultReceive = defaultReceive
exports.internalRpc = internalRpc
exports.rpc = rpc
