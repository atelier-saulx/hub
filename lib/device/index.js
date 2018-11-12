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

  hub.setServerRequest = req => {
    if (req) {
      hub.set('device.history', req.url)
      if (req.headers && req.headers['user-agent']) {
        hub.set('device.type', ua(req.headers['user-agent']))
      }
    }
  }

  hub.configure(config)
  notifications(hub)
}

exports.device = deviceConfig
