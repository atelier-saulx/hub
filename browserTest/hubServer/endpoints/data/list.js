const { Endpoint } = require('../../../../server')
const emojis = require('../../emojis')

const totalData = Array.from(Array(1e4)).map((val, i) => {
  return {
    realIndex: i,
    emoji: emojis[~~(Math.random() * emojis.length - 1)]
  }
})

const sliceRange = (data, msg) => {
  const receivedRange = msg.receivedRange
  const range = msg.range
  if (!receivedRange) {
    return [data.slice(range[0], range[1]), range]
  } else {
    // const r = [receivedRange[0] - 5, receivedRange[1] + 5]
    // console.log(r, receivedRange)
    // return [data.slice(r[0], r[1]), r]

    let r = [void 0, void 0]
    if (range[0] < receivedRange[0]) {
      r = [range[0], receivedRange[0]]
    }
    if (range[1] > receivedRange[1]) {
      r[1] = range[1]
      if (r[0] === void 0) {
        r[0] = receivedRange[1]
      }
    }
    if (r[0] !== void 0 && r[1] !== void 0) {
      return [data.slice(r[0], r[1]), r]
    }
  }
  return [[], []]
}

// if checksum is different send the whole range again

const send = (endpoint, client, msg) => {
  // if incoming request is range handle range
  // if object send merge
  const checksum = endpoint.checksum
  // also check for range
  msg.checksum = checksum
  const [content, range] = sliceRange(endpoint.data, msg)
  const payload = {
    type: 'range',
    range: range,
    content
  }

  // if checksum is different send everything
  // if the same and empty array send nothing

  // if (!checksum || !msg.checksum || checksum != msg.checksum) {
  // if (checksum) {
  //   payload.checksum = checksum
  // }
  if (content.length) {
    client.sendChannel(payload, msg, endpoint)
  }
}

const getIt = (range, endpoint) => {
  return totalData.slice(range[0], range[1])
}

class EndpointList extends Endpoint {}

// checksum can use some helpers here as well...
// need to send which range it allrdy has and checksum is of the total amount

const endpoint = new EndpointList()
endpoint.data = totalData

endpoint.content = getIt([0, 10])
// endpoint.checksum = JSON.stringify([0, 10])

module.exports = async (client, msg) => {
  console.log('receive', msg.range)
  client.subscribe(endpoint, msg)
  if (endpoint.content) {
    send(endpoint, client, msg)
  }
}
