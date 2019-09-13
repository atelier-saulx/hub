const configure = require('./configure')
const { connect: connectSocket } = require('./connection')
const { rpc } = require('./rpc')
const { format } = require('./format')
const { setLocal, mergeLocal } = require('./setLocal')
const { on, removeListener, removeComponentListener } = require('./listeners')
const { emit, emitImmediate } = require('./emit')
const { getLocal } = require('./getLocal')
const { getStore } = require('./getStore')
const { Provider: ProviderLegacy, connect } = require('./react')
const { Switch, Route, Link } = require('./react/router')
const Head = require('./react/Head')
const renderHead = require('./react/Head/renderHead')
const { device } = require('./device')
const { close } = require('./close')
const { deepNotEqual } = require('./util')
const reset = require('./reset')
const { useHub, useRpc, Provider } = require('./react/hooks')
const extend = require('./extend')
const localStorage = require('./localStorage')

var id = 0

class Hub {
  path = ''
  constructor(config) {
    this.id = ++id
    this.store = {}
    this.extensions = {}
    device(this, config)
    if (config) configure(this, config)
  }
  is(props, args, check) {
    return new Promise((resolve, reject) => {
      if (!check) {
        check = args
        args = void 0
      }
      props = format(this, props, args)
      if (typeof check !== 'function') {
        const value = check
        if (value && typeof value === 'object') {
          check = val => !deepNotEqual(val, value)
        } else {
          check = val => value === check
        }
      }
      const current = this.get(props, this)
      if (check(current, this)) {
        resolve(current)
      } else {
        const listener = val => {
          const current = this.get(props, this)
          if (check(current, this)) {
            removeListener(this, props, listener)
            resolve(current)
          }
        }
        on(this, props, listener)
      }
    })
  }
  localStorage(props) {
    return localStorage(this, props)
  }
  configure(config) {
    configure(this, config)
  }
  extend(key, fn) {
    extend(this, key, fn)
  }
  close(props, args, cb) {
    props = format(this, props, args, cb)
    close(this, props)
  }
  rpc(props, args, cb) {
    props = format(this, props, args, cb)
    return rpc(this, props)
  }
  get(props, args) {
    props = format(this, props, args)
    return getLocal(this, props)
  }
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }
  reconnect() {
    if (this.socket) {
      this.socket.reconnect(this._url)
    }
  }
  getStore(props, args) {
    props = format(this, props, args)
    return getStore(this, props)
  }
  set(props, value, immediate) {
    props = format(this, props)
    return setLocal(this, props, value, immediate)
  }
  countRefs() {
    let components = 0
    let set = 0
    let fn = 0
    for (let e in this.store) {
      for (let x in this.store[e]) {
        for (let m in this.store[e][x]) {
          const t = this.store[e][x][m].listeners
          if (t) {
            if (t.fn) {
              fn += t.fn.length
            }
            if (t.fnSet) {
              set += t.fnSet.size
            }
            if (t.components) {
              components += Object.keys(t.components).length
            }
          }
        }
      }
    }
    console.log('components', components, 'hooks', set, 'fn', fn)
  }
  merge(props, value, immediate) {
    props = format(this, props)
    return mergeLocal(this, props, value, immediate)
  }
  checksum(props, args) {
    const store = this.getStore(props, args)
    if (store) {
      return store.checksum
    }
  }
  on(props, fn, cb) {
    if (props === 'connection') {
      if (this.socket) {
        this.socket.on('open', () => fn(true))
        this.socket.on('close', () => fn(false))
      }
      return
    } else if (typeof fn === 'object') {
      props = format(this, props, fn)
      fn = cb
    } else {
      props = format(this, props)
    }
    return on(this, props, fn)
  }
  emit(props, value, immediate) {
    props = format(this, props)
    const listeners = props.store.listeners
    if (listeners) {
      if (immediate) {
        emitImmediate(this, listeners, value, props)
      } else {
        emit(this, listeners, value, props)
      }
    }
  }
  removeListener(props, fn) {
    props = format(this, props)
    if (typeof fn === 'object') {
      return removeComponentListener(this, props, fn)
    } else {
      return removeListener(this, props, fn)
    }
  }
  connect(url) {
    return connectSocket(this, url)
  }
  reset(endpoint) {
    return reset(this, endpoint)
  }
}

exports.useHub = useHub
exports.useRpc = useRpc
exports.Provider = Provider
exports.ProviderLegacy = ProviderLegacy
exports.connect = connect
exports.Switch = Switch
exports.Route = Route
exports.Link = Link
exports.Head = Head
exports.renderHead = renderHead

exports.createClient = config => {
  const hub = new Hub(config)
  return hub
}
