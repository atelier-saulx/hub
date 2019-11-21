const { connect } = require('./connection')
// const { mergeObj } = require('./util')

const mergeObj = (target, source) => {
  const t = typeof source
  if (t === 'undefined') {
    return target
  }
  if (t === 'object' && target && typeof target === 'object') {
    for (let i in source) {
      target[i] = mergeObj(target[i], source[i])
    }
    return target
  }
  return source
}

const configure = (hub, config) => {
  if (config.url) {
    connect(
      hub,
      config.url
    )
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
    // if (hub.globalSettings) {
    //   console.log(hub.globalSettings, globalSettings)
    //   console.log('allready got globalSettings might need to change!')
    // }
    hub.globalSettings = mergeObj(hub.globalSettings, globalSettings)
  }

  if (hub._config) {
    mergeObj(hub._config, config)
  } else {
    hub._config = config
  }
}

module.exports = configure
