const timers = {}
var cnt = 0

const loop = () => {
  global.requestAnimationFrame(() => {
    if (cnt) {
      for (let key in timers) {
        timers[key][0]()
      }
      loop()
    }
  })
}

const emitFn = (arr, val, props, prev) => {
  // array can be modified while looping trough it
  let i = arr.length
  while (i--) {
    // if removed while looping just skip
    // if a few removed and added while looping... not very nice
    if (arr[i]) {
      arr[i](val, props, prev)
    }
  }
}

const emitImmediate = (hub, listeners, val, props, prev) => {
  const fn = listeners.fn
  if (fn) {
    emitFn(fn, val, props, prev)
  }
  const components = listeners.components
  if (components) {
    for (let uid in components) {
      if (uid !== 'length') components[uid].update(val, props)
    }
  }
}

const emit =
  typeof window !== 'undefined'
    ? (hub, listeners, val, props, prev) => {
        const hash = props.hash
        const timerId = hub.id + hash
        if (timers[timerId]) {
          timers[timerId][1] = val
          return
        }
        cnt++
        if (cnt === 1) {
          loop()
        }
        const fn = () => {
          const val = timers[timerId][1]
          delete timers[timerId]
          cnt--
          if (listeners.removed) return
          const fn = listeners.fn
          if (fn) {
            // cant use forEach prob...
            emitFn(fn, val, props, prev)
          }
          const components = listeners.components
          if (components) {
            for (let uid in components) {
              if (uid !== 'length') {
                components[uid].update(val, props)
              }
            }
          }
        }
        timers[timerId] = [fn, val]
      }
    : emitImmediate

exports.emitImmediate = emitImmediate
exports.emit = emit
