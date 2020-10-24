const Endpoint = require('./endpoint')
const createServer = require('./server')
const fs = require('fs')
const path = require('path')
const resolveFrom = require('resolve-from')

exports.Endpoint = Endpoint

const createEndpoints = p => {
  const endpoints = {}
  p = p || path.join(path.dirname(require.main.filename), 'endpoints')
  console.log('get endpoints from path ', p)
  const last = { method: '', endpoint: '' }
  try {
    const files = fs.readdirSync(p)
    files
      .filter(file => file[0] !== '.')
      .forEach(endpoint => {
        const methods = fs.readdirSync(path.join(p, endpoint))
        endpoints[endpoint] = {}
        methods.forEach(method => {
          last.method = method
          last.endpoint = endpoint
          method = method.replace(/\.js$/, '')
          endpoints[endpoint][method] = require(path.join(p, endpoint, method))
        })
      })
  } catch (err) {
    console.error(
      `\n\n\n🔥 Problem with endpoints "${err.message}" ${last.endpoint}/${last.method} 🔥 \n\n\n`
    )
  }
  return endpoints
}

exports.createServer = function({
  port = 8080,
  ua,
  endpoints = '',
  onConnection,
  authorize,
  key,
  json,
  cert,
  debug,
  import: importEndpoints
}) {
  if (typeof endpoints === 'string' || !endpoints) {
    endpoints = createEndpoints(endpoints)
  }
  if (importEndpoints) {
    if (!Array.isArray(importEndpoints)) {
      importEndpoints = [importEndpoints]
    }
    if (!endpoints) {
      endpoints = {}
    }
    let e
    try {
      const s = new Error().stack.split('\n')
      e = s[2].match(/\((.*?):.+\)/)[1]
    } catch (err) {
      console.error('Cannot find root directory')
    }

    importEndpoints.forEach(p => {
      try {
        // __filename, __dirname
        const dir = path.dirname(e)
        let from

        if (fs.existsSync(path.join(dir, p))) {
          from = path.join(dir, p)
        } else {
          from = path.dirname(resolveFrom(dir, p))
        }

        const result = createEndpoints(path.join(from, 'endpoints'))

        if (result) {
          // deep merge
          for (let endpoint in result) {
            if (!endpoints[endpoint]) {
              endpoints[endpoint] = {}
            }
            for (let method in result[endpoint]) {
              endpoints[endpoint][method] = result[endpoint][method]
            }
          }
        }
      } catch (err) {
        console.error(`❌ Error with import "${err.message}"`)
      }
    })
  }

  if (endpoints) {
    return createServer(
      port,
      endpoints,
      ua,
      onConnection,
      authorize,
      key,
      cert,
      debug,
      json
    )
  }
}
