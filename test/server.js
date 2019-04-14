import { createClient } from '../client'
import { createServer, Endpoint } from '../server'
import test from 'ava'

const wait = time =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(time)
    }, time)
  })

test('server simple call', async t => {
  createServer({
    port: 9091,
    endpoints: {
      greet: {
        hello: (client, msg) => {
          client.send({ content: { msg: 'hello' } }, msg)
        }
      }
    }
  })
  const client = createClient({ url: 'ws://localhost:9091' })
  const reply = await client.rpc('greet.hello')
  t.is(reply.msg, 'hello')
})

test('server subscription', async t => {
  const endpoint = new Endpoint()

  let cnt = 0
  const timer = setInterval(() => {
    endpoint.emit((endpoint, client, msg) => {
      client.sendChannel(
        {
          content: ++cnt
        },
        msg,
        endpoint
      )
    })
  }, 10)

  createServer({
    port: 9092,
    ua: true,
    endpoints: {
      subscription: {
        cnt: (client, msg) => {
          client.subscribe(endpoint, msg)
        }
      }
    }
  })

  const client = createClient({ url: 'ws://localhost:9092' })
  client.rpc('subscription.cnt', data => {})

  await client.is('subscription.cnt', cnt => {
    return cnt === 20
  })

  clearInterval(timer)

  t.is(endpoint.subscriptions.size, 1)

  client.close('subscription.cnt')

  await wait(100)

  t.is(endpoint.subscriptions.size, 0)

  t.pass()
})

test('server subscription unsubscribe', async t => {
  const endpoint = new Endpoint()
  var cnt = 0
  endpoint.on('close', () => {
    // console.log('CLOSE!')
    cnt++
  })
  createServer({
    port: 9095,
    endpoints: {
      subscription: {
        cnt: (client, msg) => {
          client.subscribe(endpoint, msg)
          client.sendChannel({ content: cnt }, msg)
        }
      }
    }
  })
  const client = createClient({ url: 'ws://localhost:9095' })
  t.is(endpoint.subscriptions.size, 0)

  client.rpc('subscription.cnt', data => {})
  client.close('subscription.cnt')
  await wait(100)
  t.is(endpoint.subscriptions.size, 0)

  client.rpc('subscription.cnt', data => {})
  await wait(50)
  client.close('subscription.cnt')
  await wait(100)
  t.is(endpoint.subscriptions.size, 0)

  client.rpc('subscription.cnt', data => {})
  await wait(50)
  client.close('subscription.cnt')
  await wait(100)
  t.is(endpoint.subscriptions.size, 0)

  client.rpc('subscription.cnt', data => {})
  await wait(100)
  client.close('subscription.cnt')
  await wait(100)
  t.is(endpoint.subscriptions.size, 0)

  client.rpc('subscription.cnt', data => {})
  await wait(100)
  client.close('subscription.cnt')
  await wait(100)
  t.is(endpoint.subscriptions.size, 0)
  t.true(cnt > 0, 'fired close more then once')

  const r = await client.rpc('subscription.cnt')
  t.is(r, 4)
  await wait(100)
  t.is(endpoint.subscriptions.size, 0)

  t.pass()
})

test.only('server checksum', async t => {
  const endpoint = new Endpoint()
  var cnt = 1
  var received = 0
  const checksum = []
  createServer({
    port: 9096,
    endpoints: {
      subscription: {
        cnt: (client, msg) => {
          client.subscribe(endpoint, msg)
          checksum.push(msg.checksum)
          if (msg.checksum !== cnt) {
            client.sendChannel({ content: cnt, checksum: cnt }, msg, endpoint)
          }
        }
      }
    }
  })
  const client = createClient({ url: 'ws://localhost:9096' })
  client.rpc('subscription.cnt', data => {
    received++
  })
  await wait(100)
  t.is(client.checksum('subscription.cnt'), 1)
  client.close('subscription.cnt')
  await wait(100)
  client.rpc('subscription.cnt', data => {
    received++
  })
  await wait(100)
  t.is(received, 1)
  t.deepEqual(checksum, [undefined, 1])
  t.pass()
})

test.only('no subscriber rpc calls', async t => {
  const endpoint = new Endpoint()
  endpoint.setData(
    {
      someData: true
    },
    1
  )
  createServer({
    port: 9097,
    endpoints: {
      subscription: {
        test: (client, msg) => {
          client.subscribe(endpoint, msg)
        }
      }
    }
  })
  const client = createClient({ url: 'ws://localhost:9097' })
  const incoming = await client.rpc('subscription.test')
  await wait(100)
  t.is(endpoint.subscriptions.size, 0)
  t.deepEqual(incoming, { someData: true })
  const secondIncoming = await client.rpc('subscription.test')
  t.deepEqual(secondIncoming, { someData: true })
  t.pass()
})
