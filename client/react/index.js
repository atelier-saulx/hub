const React = require('react')
const PropTypes = require('prop-types')
const { subscribe, unsubscribe } = require('./subscribe')
const { deepNotEqual } = require('../util')

var uid = 0

if (typeof window === 'undefined') {
  const log = console.error
  // tmp solution to remove warning
  // usefull to have a state on the server for e.g. dynamic imports
  console.error = function(...args) {
    if (args[0].indexOf('Warning: setState(...):') === -1) {
      return log.apply(this, args)
    }
  }
}

class Provider extends React.Component {
  render() {
    return React.createElement(React.Fragment, null, this.props.children)
  }
  getChildContext() {
    return {
      hub: this.props.hub
    }
  }
}

Provider.childContextTypes = {
  hub: PropTypes.object
}

class BaseComponent extends React.Component {
  constructor() {
    super()
    this.state = {}
    this.uid = ++uid
  }
  componentWillMount() {
    subscribe(this)
    if (this.response) {
      this.updated = true
      this.state.data =
        this.response.length === 1 ? this.response[0] : this.response
    }
  }
  shouldComponentUpdate(next, state) {
    var update = false

    if (this.context.hub && this.context.hub.forceReset) {
      update = true
      this.updated = true
      return update
    } else if (this.hasOtherProps === void 0 && this.subscription) {
      for (let key in next) {
        if (key !== 'data') {
          this.hasOtherProps = true
          update = deepNotEqual(this.props, next) || false
          break
        }
      }
      if (!this.hasOtherProps) {
        this.hasOtherProps = false
      }
      if (!this.updated) update = true
    } else if (!this.updated) {
      update = true
    } else if (this.hasOtherProps === true && this.subscription) {
      // this one is often too strict
      update = deepNotEqual(this.props, next) || false
    } else if (!this.subscription) {
      update = true
    }
    if (update) this.updated = true
    return update
  }
  componentWillReceiveProps(next) {
    console.log(next.subscription)
    if (next.subscription || typeof this.subscription === 'function') {
      const subscription = this.props.subscription || this.subscription
      const result =
        typeof subscription === 'function'
          ? subscription(this.props, this.context.hub)
          : subscription

      if (deepNotEqual(this.nonParsedSubs, result)) {
        this.unsubscribe()
        subscribe(this, next)
        this.setState({
          data: this.response.length === 1 ? this.response[0] : this.response
        })
      }
    }
  }
  update(data, props) {
    this.updated = false
    const subscriptions = this.parsedSubscriptions
    if (subscriptions) {
      for (let i = 0, len = subscriptions.length; i < len; i++) {
        if (subscriptions[i].hash === props.hash) {
          this.response[i] = data === void 0 ? props.default : data
          break
        }
      }
      this.setState({
        data: this.response.length === 1 ? this.response[0] : this.response
      })
    }
  }
  unsubscribe() {
    unsubscribe(this)
  }
  componentWillUnmount() {
    this.removed = true
    this.unsubscribe()
  }
}

BaseComponent.contextTypes = {
  hub: PropTypes.object
}

exports.connect = (component, subscription) => {
  class FastComponent extends BaseComponent {
    render() {
      console.log(this.props.subscription)

      return React.createElement(
        component,
        Object.assign(
          {
            key: 1,
            data: this.state.data,
            hub: this.context.hub,
            subscription
          },
          this.props
        )
      )
    }
  }
  if (
    subscription &&
    typeof subscription !== 'function' &&
    !Array.isArray(subscription)
  ) {
    subscription = [subscription]
  }
  FastComponent.prototype.subscription = subscription
  return FastComponent
}

exports.Provider = Provider
