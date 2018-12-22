import { createClient } from '../client'
import { createServer } from '../server'
import test from 'ava'

test('reset', async t => {
  createServer({
    port: 9093,
    endpoints: {
      greet: {
        hello: (client, msg) => {
          client.send({ content: { msg: msg.args.msg } }, msg)
        }
      }
    }
  })

  const client = createClient({ url: 'ws://localhost:9093' })

  let reply = await client.rpc('greet.hello', {
    msg: 'hello'
  })

  t.is(reply.msg, 'hello')

  var cnt = 0

  client.on(
    'greet.hello',
    {
      msg: 'bye'
    },
    () => {
      cnt++
    }
  )

  reply = await client.rpc('greet.hello', {
    msg: 'bye'
  })

  t.is(reply.msg, 'bye')

  client.reset()

  t.is(
    client.get('greet.hello', {
      msg: 'bye'
    }),
    void 0
  )
  t.is(cnt, 2)
})
