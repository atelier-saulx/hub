import { createClient } from '../client'
import test from 'ava'
import { WebSocketServer } from '@clusterws/cws'

let channelId = 0

const wait = time =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(time)
    }, time)
  })

const handleResponses = (data, ws) => {
  const { endpoint, method, seq, args } = data
  let initial
  if (endpoint === 'hello' && method === 'goodbye') {
    initial = {
      seq,
      content: {
        lullz: true,
        args
      }
    }
  }
  if (endpoint === 'stream' && method === 'funstream') {
    let i = 1
    const channel = ++channelId
    initial = {
      channel,
      seq,
      content: {
        number: i,
        token: data.token
      }
    }
    const count = () => {
      ws.send(JSON.stringify({ channel, content: { number: ++i } }))
      if (i < 5) {
        setTimeout(count, 100)
      }
    }
    setTimeout(count, 100)
  }

  ws.send(JSON.stringify(initial))
}

test('rpc calls', async t => {
  const wss = new WebSocketServer({ port: 9919 })
  wss.on('connection', ws => {
    ws.on('message', message => {
      const incoming = JSON.parse(message)
      incoming.forEach(data => handleResponses(data, ws))
    })
  })

  const client = createClient()
  let incomingCnt = 0

  client.configure({
    url: 'ws://localhost:9919',
    user: {
      token: { send: false }
    },
    global: {
      on: ['user.token'],
      incoming: (hub, payload) => {
        incomingCnt++
        return payload
      },
      send: (hub, payload) => {
        payload.token = hub.get('user.token')
        return payload
      }
    }
  })

  client.set('user.token', 'hello')

  const simple = await client.rpc('hello.goodbye', { something: true })

  t.deepEqual(simple, {
    lullz: true,
    args: { something: true }
  })

  const arr = []
  const tokens = []

  client.rpc('stream.funstream', ({ number, token }) => {
    arr.push(number)
    if (token) tokens.push(token)
  })

  await client.is('stream.funstream', { number: 5 })

  t.deepEqual(arr, [1, 2, 3, 4, 5])

  t.is(incomingCnt, 6)

  t.deepEqual(tokens, ['hello'])

  client.set('user.token', 'bye')

  await wait(100)

  t.is(incomingCnt, 7)

  t.deepEqual(tokens, ['hello', 'bye'])

  t.pass()
})
