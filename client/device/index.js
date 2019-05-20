const ua = require('vigour-ua')

const notifications = require('./notifications')

const deviceConfig = hub => {
  const config = {
    device: {
      send: false,
      history: {
        transform: (hub, value) => {
          return hub.path + value
        },
        default: hub.path + '/'
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

  hub.hub.setServerRequest = (req, parsedUa) => {
    /*
      parsed ua is in the format of { device, platform, browser, version }
    */

    const url = req.url ? req.url.replace(hub.path, '') : ''
    if (req) {
      hub.set('device.history', url)
      if (parsedUa) {
        hub.set('device.type', parsedUa)
      } else if (req.headers && req.headers['user-agent']) {
        hub.set('device.type', ua(req.headers['user-agent']))
      }
    }
  }

  hub.configure(config)

  // hub.on('device.history', () => {

  // })

  notifications(hub)
}

exports.device = deviceConfig
