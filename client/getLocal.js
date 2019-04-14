const getLocal = (hub, props) => {
  const store = props.store
  const v = store.v === void 0 ? props.default : store.v
  if (v !== void 0 && props.range) {
    if (store.range) {
      return v.slice(
        props.range[0] - store.range[0],
        props.range[1] - store.range[0]
      )
    } else {
      return v.slice(props.range[0], props.range[1])
    }
  }
  return v
}

exports.getLocal = getLocal
