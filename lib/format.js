// only syntax sugar + config reading
const { getStore } = require('./getStore')
const stringHash = require('string-hash')
const fields = ['send', 'call', 'receive', 'args', 'on', 'onChange', 'default']

const config = (hub, result) => {
  const config = hub.config
  if (config) {
    const { endpoint, method } = result
    const e = config[endpoint]
    if (e) {
      const m = e[method]
      for (let key in m) {
        if (result[key] === void 0) {
          result[key] = m[key]
        }
      }
      fields.forEach(key => {
        if (result[key] === void 0) {
          const k = e[key]
          result[key] = k
        }
      })
    }
  }
  return result
}

const hash = props => {
  if (props.args === void 0) {
    props.hash = stringHash(props.endpoint + props.method)
  } else {
    props.hash = stringHash(
      props.endpoint + props.method + JSON.stringify(props.args)
    )
  }
}

const format = (hub, props, args, cb) => {
  var result
  if (typeof props === 'string') {
    const split = props.split('.')
    const method = split[split.length - 1]
    const endpoint = split.slice(0, -1).join('.')
    result = { method, endpoint }
  } else {
    result = props
  }

  if (args !== void 0) {
    if (cb) {
      result.args = args
      result.onChange = cb
    } else if (typeof args === 'function') {
      result.onChange = args
    } else {
      result.args = args
    }
  }

  // config
  result = config(hub, result)

  if (result.on) {
    if (!Array.isArray(result.on)) {
      result.on = [result.on]
    }
    result._onParsed = result.on.map(val => format(hub, val))
  }

  if (result.onChange) {
    result.isSubscriber = true
  }

  if (result.call) {
    if (!result._prevArgsSet) {
      result._prevArgs = result.args
      result._prevArgsSet = true
    }
    result = result.call(hub, result)
  }

  if (!result.hash) {
    hash(result)
  }

  if (!result.store) {
    result.store = getStore(hub, result)
  }

  return result
}

exports.hash = hash
exports.config = config
exports.format = format
