const { format } = require('./format')

module.exports = (hub, params) => {
  if (typeof window !== 'undefined' && global.localStorage) {
    const props = format(hub, params)
    const localValue = global.localStorage.getItem(props.hash)
    if (localValue) {
      try {
        hub.set(props, JSON.parse(localValue))
      } catch (e) {
        console.log('error getting from localstorage', e)
      }
    }
    // want an on setting of every version of this field
    hub.on(props, t => {
      try {
        global.localStorage.setItem(props.hash, JSON.stringify(t))
      } catch (e) {
        console.log('error setting  localstorage', e)
      }
    })
    return localValue
  }
}
