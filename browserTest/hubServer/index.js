const { createServer } = require('../../server')

// json true or for certain endpoints
createServer({ port: 6062, ua: true, json: true })

// json: () => {} // for potential security filtering out endpoints etc
