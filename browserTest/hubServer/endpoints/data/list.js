const { Endpoint } = require('../../../../server')
const endpoints = {}
const emojis = require('../../emojis')

const send = (endpoint, client, msg) => {
  const checksum = endpoint.checksum
  // eslint-disable-next-line
  if (checksum != msg.checksum) {
    msg.checksum = checksum
    const content = endpoint.content
    client.sendChannel(
      {
        checksum,
        type: 'new',
        content
      },
      msg,
      endpoint
    )
  }
}

const totalData = Array.from(Array(1e4)).map((val, i) => {
  return {
    realIndex: i,
    emoji: emojis[~~(Math.random() * emojis.length - 1)]
  }
})

const getIt = range => {
  return totalData.slice(...range)
}

class EndpointList extends Endpoint {
  constructor(id) {
    super()
    endpoints[id] = this
    this.id = id
    this.content = getIt([0, 100])
  }
  remove() {
    delete endpoints[this.id]
  }
}

const createPage = msg => {
  const id = msg.args.id
  var endpoint = endpoints[id]
  if (!endpoint) {
    endpoint = endpoints[id] = new EndpointList(id)
  }
  return endpoint
}

module.exports = async (client, msg) => {
  // range as well
  const range = msg.range || ''
  console.log(msg, range)
  const endpoint = createPage(msg)
  client.subscribe(endpoint, msg)
  console.info('💻 Subscribe client list', msg.args.id, client.ua)
  if (endpoint.content) {
    send(endpoint, client, msg)
  }
}

module.exports.endpoints = endpoints
