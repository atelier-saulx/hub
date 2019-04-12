const { Endpoint } = require('../../../../server')
const emojis = require('../../emojis')

class EndpointList extends Endpoint {}

const endpoint = new EndpointList()

var cnt = 0
setInterval(() => {
  cnt++
  const totalData = Array.from(Array(1e4)).map((val, i) => {
    return {
      realIndex: i,
      emoji: emojis[~~(Math.random() * emojis.length - 1)]
    }
  })
  endpoint.setData(totalData, cnt)
  endpoint.emit()
}, 5e3)

module.exports = async (client, msg) => {
  console.log('receive', msg)
  client.subscribe(endpoint, msg)
}
