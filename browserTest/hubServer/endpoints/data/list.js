const { Endpoint } = require('../../../../server')
const emojis = require('../../emojis')

const endpoint = new Endpoint()

var cnt = 0

const d = () => {
  cnt++
  const totalData = Array.from(Array(5)).map((val, i) => {
    return {
      realIndex: i,
      emoji: emojis[~~(Math.random() * emojis.length - 1)]
    }
  })
  endpoint.setData(totalData, cnt)
  endpoint.emit()
}

setInterval(d, 5e3)

d()

module.exports = async (client, msg) => {
  console.log('receive', msg)
  client.subscribe(endpoint, msg)
}
