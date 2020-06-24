const { connect } = require('./connection')

const merge = (prev, next) => {
  if (
    typeof next === 'object' &&
    typeof prev === 'object' &&
    next !== null &&
    prev !== null
  ) {
    for (const i in next) {
      prev[i] = merge(prev[i], next[i])
    }
    return prev
  }
  return next === undefined ? prev : next
}

const parseOn = config => {
  for (let key in config) {
    if (key === 'on') {
      let on = config[key]
      if (!Array.isArray(on)) {
        config[key] = on = [on]
      }
      for (let i = 0; i < on.length; i++) {
        if (typeof on[i] === 'string') {
          const [enpoint, method] = on[i].split('.')
          on[i] = {
            enpoint,
            method
          }
        }
      }
    } else if (typeof config[key] === 'object') {
      parseOn(config[key])
    }
  }
}

const configure = (hub, config) => {
  parseOn(config)

  if (config.url) {
    connect(hub, config.url)
    delete config.url
  }

  if (config.browser || (config.browser !== false && hub.isNode == false)) {
    hub.isNode = false
  } else {
    hub.isNode = typeof window === 'undefined'
  }

  if (config.path) {
    hub.path = config.path
    delete config.path
  }

  if (config.global) {
    if (hub._config && hub._config.global) {
      if (hub._config.global.incoming && config.global.incoming) {
        const p = config.global.incoming
        const p2 = hub._config.global.incoming
        config.global.incoming = (hub, payload) => {
          return p(hub, p2(hub, payload))
        }
      }
      if (hub._config.global.send && config.global.send) {
        const p = config.global.send
        const p2 = hub._config.global.send
        config.global.send = (hub, payload) => {
          return p(hub, p2(hub, payload))
        }
      }
    }
    const globalSettings = config.global
    if (globalSettings.on) {
      globalSettings.on.forEach(val => {
        hub.on(val, () => {
          if (hub.socket) {
            hub.socket.resendAllSubscriptions()
          }
        })
      })
    }
    hub.globalSettings = merge(hub.globalSettings, globalSettings)
  }

  if (hub._config) {
    merge(hub._config, config)
  } else {
    hub._config = config
  }
}

module.exports = configure
