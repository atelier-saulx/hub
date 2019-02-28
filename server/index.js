const Endpoint = require('./endpoint')
const createServer = require('./server')
const fs = require('fs')
const path = require('path')

exports.Endpoint = Endpoint

const createEndpoints = p => {
  const endpoints = {}
  p = p || path.join(path.dirname(require.main.filename), 'endpoints')
  try {
    const files = fs.readdirSync(p)
    files
      .filter(file => file[0] !== '.')
      .forEach(endpoint => {
        const methods = fs.readdirSync(path.join(p, endpoint))
        endpoints[endpoint] = {}
        methods.forEach(method => {
          method = method.replace(/\.js$/, '')
          endpoints[endpoint][method] = require(path.join(p, endpoint, method))
        })
      })
  } catch (err) {
    console.error(`Problem with endpoints "${err.message}"`)
  }
  return endpoints
}

exports.createServer = ({ port = 8080, ua, endpoints = '' }) => {
  // require('path').dirname(require.main.filename)
  // if not endpoint
  if (typeof endpoints === 'string' || !endpoints) {
    endpoints = createEndpoints(endpoints)
  }
  if (endpoints) {
    return createServer(port, endpoints, ua)
  }
}
