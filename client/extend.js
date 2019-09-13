const extend = (hub, key, fn) => {
  if (!hub.extensions[key]) {
    fn(hub)
  }
}

module.exports = extend
