const { device, platform, browser, version } = require('vigour-ua/navigator')
const notifications = require('./notifications')

const deviceConfig = hub => {
  const config = {
    device: {
      send: false,
      history: {
        default: global.location ? global.location.pathname : ''
      },
      type: {
        default: {
          device,
          platform,
          browser,
          version
        }
      }
    }
  }
  hub.configure(config)
  if (global.location) {
    hub.on('device.history', (val, props) => {
      console.log(global.location)
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
