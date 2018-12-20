import { createClient } from '../client'
import test from 'ava'

test('notifications', async t => {
  const client = createClient()

  client.error({ message: '😋', timer: 300 })

  const notifications = client.get('device.notifications')

  t.snapshot(notifications)

  await new Promise(resolve => {
    client.on('device.notifications', () => {
      t.deepEqual(client.get('device.notifications'), [])
      resolve()
    })
  })

  t.pass()
})
