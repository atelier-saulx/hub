const ua = require('vigour-ua')

const notifications = require('./notifications')

const deviceConfig = hub => {
  const config = {
    device: {
      send: false,
      history: {
        default: '/'
      },
      type: {
        default: {
          device: 'server',
          platform: 'server',
          browser: 'server',
          version: 0
        }
      }
    }
  }

  hub.setServerRequest = (req, parsedUa) => {
    /*
      parsed ua is in the format of { device, platform, browser, version }
    */
    if (req) {
      hub.set('device.history', req.url)
      if (parsedUa) {
        hub.set('device.type', parsedUa)
      } else if (req.headers && req.headers['user-agent']) {
        hub.set('device.type', ua(req.headers['user-agent']))
      }
    }
  }

  hub.configure(config)
  notifications(hub)
}

exports.device = deviceConfig
