const getStore = (hub, props) => {
  var { endpoint, method, hash } = props
  let endpointObj = hub.store[endpoint]
  if (!endpointObj) {
    endpointObj = hub.store[endpoint] = {}
  }
  let methodObj = endpointObj[method]
  if (!methodObj) {
    methodObj = endpointObj[method] = {}
  }
  let argsObj = methodObj[hash]
  if (!argsObj) {
    argsObj = methodObj[hash] = {}
  }
  return argsObj
}

exports.getStore = getStore
