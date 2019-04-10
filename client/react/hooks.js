const React = require('react')
const { useContext, useEffect, useState, useRef } = React
const HubContext = React.createContext({})
const { config } = require('../format')
const { internalRpc } = require('../rpc')
const { close } = require('../close')
const { getLocal } = require('../getLocal')
const { getStore } = require('../getStore')
const { hash, argHasher, djb2 } = require('../hash')
const { Provider: ProviderLegacy } = require('./')

exports.Provider = ({ hub, children }) => {
  return React.createElement(
    HubContext.Provider,
    {
      value: hub
    },
    React.createElement(ProviderLegacy, { hub }, children)
  )
}

exports.HubContext = HubContext

exports.useHub = () => {
  return useContext(HubContext)
}

const convertToObject = props => {
  const split = props.split('.')
  const method = split[split.length - 1]
  const endpoint = split.slice(0, -1).join('.')
  return { method, endpoint }
}
const hookFormat = (hub, props, args, hashed) => {
  if (typeof props === 'string') {
    props = convertToObject(props)
  }
  if (args !== void 0) {
    props.args = args
  }
  props.hash = hashed || hash(props)
  config(hub, props)
  props.store = getStore(hub, props)
  return props
}

exports.useRpc = (subscription, args) => {
  const hub = useContext(HubContext)
  let [result, update] = useState()
  const ref = useRef()
  const idRef = useRef()

  if (subscription) {
    let parsed
    let id
    let hashed
    const isString = typeof subscription === 'string'

    // var t0 = performance.now()
    if (isString && args === void 0) {
      id = subscription
    } else if (!isString && subscription.args === void 0 && args === void 0) {
      id = subscription.endpoint + '.' + subscription.method
    } else {
      if (args) {
        if (isString) {
          const split = subscription.split('.')
          hashed = argHasher(args, djb2(split[0], djb2(split[1]))) >>> 0
        } else {
          hashed =
            argHasher(
              args,
              djb2(subscription.endpoint, djb2(subscription.method))
            ) >>> 0
        }
      } else {
        hashed = hash(subscription)
      }
      id = hashed
    }

    if (result === void 0 || (idRef && idRef.current !== id)) {
      if (!parsed) parsed = hookFormat(hub, subscription, args, hashed)
      result = getLocal(hub, parsed)
    }
    idRef.current = id

    useEffect(
      () => {
        // console.log('init subs', id)
        if (!parsed) parsed = hookFormat(hub, subscription, args, hashed)
        ref.current = parsed
        parsed.isSubscriber = true
        parsed.id = id
        // parsed.listenening = false
        parsed.fromHook = true
        parsed.onChange = v => {
          // console.log('ok ok ok update?')
          update(v)
        }
        if (!hub.isNode) {
          // double check if this gets called with a local url allways
          internalRpc(hub, parsed)
        }
        return () => {
          // console.log('remove subs', id)
          close(hub, ref.current)
        }
      },
      [id]
    )
  }
  return result
}
