const Endpoint = require('./endpoint')
const startServer = require('./server')
const fs = require('fs')
const path = require('path')

exports.Endpoint = Endpoint

const createEndpoints = p => {
  const endpoints = {}
  p = p || path.join(path.dirname(require.main.filename), 'endpoints')
  const files = fs.readdirSync(p)
  files.forEach(endpoint => {
    const methods = fs.readdirSync(path.join(p, endpoint))
    endpoints[endpoint] = {}
    methods.forEach(method => {
      method = method.replace(/\.js$/, '')
      endpoints[endpoint][method] = require(path.join(p, endpoint, method))
    })
  })
  return endpoints
}

exports.createServer = ({ port = 8080, endpoints = '' }) => {
  // require('path').dirname(require.main.filename)
  // if not endpoint
  if (typeof endpoints === 'string' || !endpoints) {
    endpoints = createEndpoints(endpoints)
  }
  if (endpoints) {
    return startServer(port, endpoints)
  }
}
