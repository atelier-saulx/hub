const React = require('react')
const { useContext, useEffect, useState, useRef } = React
const HubContext = React.createContext({})
const { config, format } = require('../format')
const { internalRpc } = require('../rpc')
const { close } = require('../close')
const { getLocal } = require('../getLocal')
const { getStore } = require('../getStore')
const { Provider: ProviderLegacy } = require('./')
const { hash } = require('@saulx/hash')

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
  props.hash =
    hashed || props.hash || hash([props.endpoint, props.method, props.args])
  config(hub, props)

  if (props.on) {
    // can become preparsed from config
    props._onParsed = props.on.map(val => format(hub, val))
  }

  props.store = getStore(hub, props)

  if (props.onTimeout) {
    props.store._needConfirmation = true
  }
  return props
}

const updateRange = (hub, subscription, id, previous) => {
  const range = subscription.range
  const parsed = previous.parsed
  if (
    parsed &&
    previous.id === id &&
    (!previous.range ||
      previous.range[0] !== range[0] ||
      previous.range[1] !== range[1])
  ) {
    parsed.range = range
    previous.range = range
    internalRpc(hub, parsed)
    return true
  }
}

let cnt = 0
exports.useBehaviour = (behaviour, key) => {
  const hub = useContext(HubContext)
  if (!key) {
    if (!behaviour.id) {
      behaviour.id = ++cnt
    }
    hub.extend(behaviour.id, behaviour)
  } else {
    hub.extend(key, behaviour)
  }
  return hub
}

const isNode = typeof window === 'undefined'

// var cnt = 0
exports.useData = (
  subscription,
  args,
  defaultValue,
  customHook = useEffect
) => {
  const hub = useContext(HubContext)
  let [result, update] = useState({})
  const ref = useRef({ parsed: false, range: false, id: false })
  const previous = ref.current
  let parsed, id, hashed, changedRange

  if (subscription) {
    const isString = typeof subscription === 'string'
    if (!isString && args && !defaultValue) {
      defaultValue = args
      args = void 0
    }
    if (isString && args === void 0) {
      id = subscription
    } else if (!isString && subscription.args === void 0 && args === void 0) {
      id = subscription.endpoint + '.' + subscription.method
      if (subscription.range) {
        changedRange = updateRange(hub, subscription, id, previous)
      }
    } else {
      if (args) {
        if (isString) {
          const split = subscription.split('.')
          hashed = hash([split[0], split[1], args])
        } else {
          hashed = hash([
            subscription.endpoint,
            subscription.method,
            subscription.args
          ])
        }
      } else {
        hashed = hash([
          subscription.endpoint,
          subscription.method,
          subscription.args
        ])
        if (subscription.range) {
          changedRange = updateRange(hub, subscription, hashed, previous)
        }
      }
      id = hashed
    }

    if (
      changedRange ||
      result.v === void 0 ||
      (previous.id && previous.id !== id)
    ) {
      if (!parsed) parsed = hookFormat(hub, subscription, args, hashed)
      const l = getLocal(hub, parsed)
      result.v = l
      result = { v: l }
      // return result.v
    }
    previous.id = id
  } else {
    result.v = void 0
    result = void 0
    previous.id = subscription
  }
  if (!isNode) {
    customHook(() => {
      if (subscription) {
        if (!parsed) parsed = hookFormat(hub, subscription, args, hashed)
        previous.parsed = parsed
        if (parsed.range) {
          previous.range = parsed.range
        }
        parsed.isSubscriber = true
        parsed.id = id
        parsed.fromHook = true

        parsed.onChange = update

        if (!hub.isNode) {
          internalRpc(hub, parsed)
        }
        return () => {
          close(hub, previous.parsed)
        }
      }
    }, [id])
  }

  return result === void 0 || result.v === void 0 ? defaultValue : result.v
}
