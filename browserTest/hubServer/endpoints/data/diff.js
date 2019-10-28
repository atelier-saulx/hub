const { Endpoint } = require('../../../../server')
// const emojis = require('../../emojis')

const endpoint = new Endpoint()

const { diff } = require('deep-object-diff')

let history = []

const createRandomItems = cnt => {
  var len = ~~(Math.random() * 10)
  const arr = []
  for (let i = 0; i < len; i++) {
    arr.push({
      name: ~~(Math.random() * 5)
    })
  }
  return arr
}

var cnt = 0
setInterval(() => {
  cnt++
  const checksum = cnt
  let content = {
    a: [
      { name: 'smurf', items: [{ name: 'gurky' }, { name: 'gurkens' }] },
      { name: 'blurf', items: createRandomItems() }
    ]
  }
  history.push(content)
  if (history[history.length - 2]) {
    const diffResult = diff(history[history.length - 2], content)

    // console.log(
    //   'yes',
    //   JSON.stringify(content, false, 2),
    //   JSON.stringify(diffResult, false, 2)
    // )

    const diffParsed = {
      from: [cnt - 1, cnt],
      content: JSON.stringify(diffResult)
    }

    endpoint.setDiff(diffParsed)
  }
  endpoint.setContent(content, checksum * 1)
  endpoint.emit()
}, 5000)

module.exports = async (client, msg) => {
  //   console.log('receive', msg)
  client.subscribe(endpoint, msg)
}
