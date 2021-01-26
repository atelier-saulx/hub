const { format } = require('./format')

module.exports = (hub, params) => {
  if (typeof window !== 'undefined') {
    try {
      if (global.localStorage) {
        const props = format(hub, params)
        let localValue

        try {
          localValue = global.localStorage.getItem(props.hash)
          if (localValue) {
            hub.set(props, JSON.parse(localValue))
          }
        } catch (e) {
          console.log('error getting from localstorage', e)
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
    } catch (e) {}
  }
}
