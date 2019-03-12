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

  const config = {
    device: {
      send: false,
      history: {
        default: global.location ? global.location.pathname : ''
      },
      type: {
        default: parsedUa
      }
    }
  }
  hub.configure(config)
  if (global.location && global.history && global.history.pushState) {
    hub.on('device.history', (val, props) => {
      if (val !== global.location.pathname) {
        global.history.pushState({}, val, val)
      }
    })
    global.addEventListener('popstate', () => {
      hub.set('device.history', global.location.pathname)
    })
  }
  notifications(hub)
}

exports.device = deviceConfig
