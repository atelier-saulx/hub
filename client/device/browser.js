const notifications = require('./notifications')

const deviceConfig = (hub, conf) => {
  /*
    parsed ua is in the format of { device, platform, browser }
  */
  const parsedUa = conf.ua || {
    device: 'dekstop',
    platform: 'mac',
    browser: 'chrome',
    version: 70
  }

  if (!conf.ua) {
    console.log(
      'You may want to add a parsed user agent to the hub configuration'
    )
  }

  const location = () =>
    global.location
      ? global.location.href.replace(global.location.origin, '')
      : ''

  const config = {
    device: {
      send: false,
      history: {
        transform: (hub, value) => {
          if (value.indexOf(hub.path) === 0) {
            return value
          }
          return hub.path + value
        },
        default: location()
      },
      type: {
        default: parsedUa
      }
    }
  }
  hub.configure(config)
  if (global.location && global.history && global.history.pushState) {
    hub.on('device.history', val => {
      if (val !== location()) {
        global.history.pushState({}, val, val)
      }
    })
    global.addEventListener('popstate', () => {
      hub.set('device.history', location())
    })
  }
  notifications(hub)
}

exports.device = deviceConfig
