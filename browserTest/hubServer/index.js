const { createServer } = require('../../server')

// json true or for certain endpoints
createServer({
  port: 6062,
  ua: true,
  json: msg => {
    console.log(msg)
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
