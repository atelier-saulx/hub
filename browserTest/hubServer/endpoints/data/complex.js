const { Endpoint } = require('../../../../server')
const emojis = require('../../emojis')

const endpoints = {}

const createEndpoint = id => {
  const endpoint = new Endpoint()
  const d = () => {
    const totalData = Array.from(Array(500)).map((val, i) => {
      return {
        realIndex: i,
        emoji: id + '-' + emojis[~~(Math.random() * emojis.length - 1)]
      }
    })
    endpoint.setData(totalData)
    endpoint.emit()
  }
  d()
  return endpoint
}

module.exports = async (client, msg) => {
  console.log('receive', msg)
  const id = msg.args.id
  if (!endpoints[id]) {
    endpoints[id] = createEndpoint(id)
  }
  client.subscribe(endpoints[id], msg)
}
