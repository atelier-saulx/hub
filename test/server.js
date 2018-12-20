import { createClient } from '../client'
import { createServer } from '../server'
import test from 'ava'

test('server traffic', async t => {
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
