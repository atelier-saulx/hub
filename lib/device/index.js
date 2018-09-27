const isNode = typeof window === 'undefined'
const notifications = require('./notifications')

const device = hub => {
  const config = {
    device: {
      send: false,
      history: {
        default: !isNode ? global.location.pathname : '/'
      }
    }
  }

  hub.configure(config)

  if (!isNode) {
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

exports.device = device
