import { createClient } from '../client'
import { createServer } from '../server'
import test from 'ava'
import { wait } from '@saulx/utils'

test('authorize', async t => {
  createServer({
    port: 9191,
    authorize: async () => {
      await wait(3e3)
      console.log('in coming connection - authorized')
      return true
    },
    endpoints: {
      greet: {
        hello: (client, msg) => {
          client.send({ content: { msg: 'hello' } }, msg)
        }
      }
    }
  })
  const client = createClient({ url: 'ws://localhost:9191' })
  const reply = await client.rpc('greet.hello')
  t.is(reply.msg, 'hello')
})
