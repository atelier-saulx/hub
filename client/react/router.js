const React = require('react')
const { connect } = require('./index')
const PropTypes = require('prop-types')
const qs = require('query-string')
// adds 3kb to project
const pathToRegexp = require('path-to-regexp')

class Link extends React.Component {
  render() {
    const { children, to, hub, style, className } = this.props
    return React.createElement(
      'a',
      {
        href: hub.path + to,
        onClick: e => {
          hub.set('device.history', to)
          e.stopPropagation()
          e.preventDefault()
        },
        style,
        className
      },
      children
    )
  }
}

class Switch extends React.Component {
  constructor() {
    super()
    this.switchState = {}
  }
  getChildContext() {
    return {
      switchState: this.switchState
    }
  }
  render() {
    return this.props.children || null
  }
}

Switch.childContextTypes = {
  switchState: PropTypes.object
}

const parsed = {}

class Route extends React.Component {
  constructor() {
    super()
    this.state = {
      child: null,
      loaded: false
    } // add a nice loader class
  }
  loadAsync() {
    this.props.asyncComponent().then(val => {
      this.setState({ child: val, loaded: true })
    })
  }
  getChildContext() {
    return {
      switchState: false
    }
  }
  render() {
    const {
      data,
      path: inputPath,
      exact,
      component,
      asyncComponent,
      hub
    } = this.props

    let path = hub.path + inputPath

    if (inputPath === '/' && hub.path) {
      path = hub.path
    }

    const switchState = this.context.switchState
    if (switchState) {
      if (
        switchState.data === data &&
        switchState.selected &&
        switchState.selected !== path
      ) {
        return null
      } else {
        switchState.data = data
        switchState.selected = false
      }
    }
    if (!parsed[path]) {
      const keys = []
      const re = pathToRegexp(path, keys, { end: !!exact })
      parsed[path] = {
        re,
        keys
      }
    }

    const matched = parsed[path].re.exec(data)
    let match
    if (matched) {
      const hasQuery = /\?.{1,500}$/.test(data)
      const q = hasQuery && data.split('?')[1]
      match = {
        params: parsed[path].keys.reduce((params, { name }, index) => {
          params[name] = hasQuery
            ? matched[index + 1].split('?')[0]
            : matched[index + 1]
          return params
        }, {})
      }
      match.query = qs.parse(q)
    }

    if (match) {
      if (switchState) {
        switchState.selected = path
      }
      if (asyncComponent) {
        if (!this.state.loaded) this.loadAsync()
        return this.state.child
          ? React.createElement(this.state.child, { hub, match })
          : null
      } else {
        return React.createElement(component, { hub, match })
      }
    }
    return null
  }
}

Route.contextTypes = {
  switchState: PropTypes.oneOfType([PropTypes.bool, PropTypes.object])
}

Route.childContextTypes = {
  switchState: PropTypes.bool
}

exports.Link = connect(Link)

exports.Switch = Switch

exports.Route = connect(
  Route,
  'device.history'
)
