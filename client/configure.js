const { connect } = require('./connection')
const { mergeObj } = require('./util')

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
    if (hub.globalSettings) {
      console.log('allready got globalSettings might need to change!')
    }
    hub.globalSettings = globalSettings
  }

  if (hub._config) {
    mergeObj(hub._config, config)
  } else {
    hub._config = config
  }
}

module.exports = configure
