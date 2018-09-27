const getLocal = (hub, props) => {
  const store = props.store
  return store.v === void 0 ? props.default : store.v
}

exports.getLocal = getLocal
