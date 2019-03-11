const { format } = require('../format')
const { internalRpc } = require('../rpc')
const { parseData } = require('./data')
const { close } = require('../close')

const deepCopy = subscription => {
  return typeof subscription === 'object'
    ? Object.assign({}, subscription)
    : subscription
}

const subscribe = (component, props) => {
  if (!props) props = component.props
  const hub = component.context.hub
  var subscription = props.subscription || component.subscription
  var subsArray

  if (typeof subscription === 'function') {
    subscription = subscription(component.props, hub)
  }

  if (subscription) {
    if (!Array.isArray(subscription)) {
      subsArray = [subscription]

      component.nonParsedSubs = deepCopy(subscription)
    } else {
      subsArray = subscription
      component.nonParsedSubs = subscription.map(deepCopy)
    }

    const response = (component.response = [])

    subsArray.forEach((val, i) => {
      if (typeof val !== 'object' || !val.hash || val.call) {
        subsArray[i] = format(hub, val)
      }
      subsArray[i].isSubscriber = true
      subsArray[i].listenening = false
      subsArray[i].onChange = component
      // dont fire here...

      if (!hub.isNode) {
        internalRpc(hub, subsArray[i])
      }

      response[i] = parseData(hub, subsArray[i])
    })
    // close
    component.parsedSubscriptions = subsArray
  }
}

const unsubscribe = component => {
  const hub = component.context.hub
  if (component.parsedSubscriptions) {
    component.parsedSubscriptions.forEach(val => {
      close(hub, val, component)
    })
  }
}

exports.subscribe = subscribe
exports.unsubscribe = unsubscribe
