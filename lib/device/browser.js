const { device, platform, browser, version } = require('vigour-ua/navigator')

/*
export const stats = { hasTouch: false }
// make this a hub plugin
export default hub => {
  const touch = 'touchstart'
  global.addEventListener(
    touch,
    function onFirstTouch() {
      hub.set('device.touch', true)
      global.removeEventListener(touch, onFirstTouch, false)
    },
    false
  )
}
*/

const deviceConfig = hub => {
  const config = {
    device: {
      send: false,
      history: {
        default: global.location.pathname
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
  hub.on('device.history', (val, props) => {
    if (val !== global.location.pathname) {
      global.history.pushState({}, val, val)
    }
  })
  global.addEventListener('popstate', () => {
    hub.set('device.history', global.location.pathname)
  })
}

exports.device = deviceConfig
