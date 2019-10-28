const { createServer } = require('../../server')
// const extension = require('../extension')
// either an object or a path

// json true or for certain endpoints
createServer({
  port: 6062,
  ua: true,
  import: ['../extension', 'babel-core'],
  json: msg => {
    if (
      msg.endpoint === 'data' &&
      msg.method === 'simple' &&
      msg.args &&
      msg.args.token === 'aqwqdwoiodhzdfklnewlknq1oiiih!'
    ) {
      return true
    }
  }
})

// json: () => {} // for potential security filtering out endpoints etc
