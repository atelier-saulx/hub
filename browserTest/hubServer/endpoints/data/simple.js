const { Endpoint } = require('../../../../server')
const emojis = require('../../emojis')

const endpoint = new Endpoint()

var cnt = 0
setInterval(() => {
  cnt++
  const totalData = Array.from(Array(10)).map((val, i) => {
    return {
      realIndex: i,
      emoji: emojis[~~(Math.random() * emojis.length - 1)]
    }
  })
  endpoint.setData(totalData, cnt)
  endpoint.emit()
}, 1e3)

module.exports = async (client, msg) => {
  // console.log('receive', msg)
  client.subscribe(endpoint, msg)
}

// how to deal with a subscribe endpoint?
