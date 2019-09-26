const extend = (hub, key, fn) => {
  if (!hub.extensions[key]) {
    hub.extensions[key] = true
    fn(hub)
  }
}

module.exports = extend
