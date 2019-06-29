const { Endpoint } = require('../../../../server')
// const emojis = require('../../emojis')

const endpoint = new Endpoint()

/*
   if (diff) {
          this.setDiff(diff)
        }
*/

var cnt = 0
setInterval(() => {
  cnt++

  const checksum = cnt

  let content = {
    a: [
      { name: 'smurf', items: [{ name: 'gurky' }, { name: 'gurkens' }] },
      { name: 'blurf', items: [{ name: 'flap' }, { name: 'flurpy' }] }
    ]
  }

  endpoint.setContent(content, checksum * 1)
  //   if (diff) {
  //     endpoint.setDiff(diff)
  //   }

  endpoint.emit()
}, 1e3)

module.exports = async (client, msg) => {
  console.log('receive', msg)
  client.subscribe(endpoint, msg)
}
