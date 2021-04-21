const { Endpoint } = require('../../../../server')
const emojis = require('../../emojis')

const endpoint = new Endpoint()

var cnt = 0

let totalData = Array.from(Array(100)).map((val, i) => {
  return {
    realIndex: i,
    emoji: emojis[~~(Math.random() * emojis.length - 1)]
  }
})

const d = () => {
  cnt++
  endpoint.setData(totalData, cnt)
  endpoint.emit()

  // console.log(endpoint.subscriptions)
}

const r = () => {
  totalData.splice(Math.floor(Math.random() * totalData.length), 1)
  if (totalData.length === 0) {
    totalData = Array.from(Array(100)).map((val, i) => {
      return {
        realIndex: i,
        emoji: emojis[~~(Math.random() * emojis.length - 1)]
      }
    })
  }
  console.log(totalData)
  endpoint.setData(totalData, cnt)
  endpoint.emit()
}

setInterval(r, 100)

d()

module.exports = async (client, msg) => {
  console.log('receive', msg)
  client.subscribe(endpoint, msg)
}
