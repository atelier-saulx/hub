import { hash } from '../client/hash'
import test from 'ava'

test.only('hash', async t => {
  // const logs = useData('serviceInstance.logs', { id: id })

  // const stats = useData('stats.range', { id })

  //   const data = useData('machine.details', { id })

  const id = 'siDMKw5k'

  const a = {
    endpoint: 'serviceInstance',
    method: 'log',
    args: { id }
  }

  const b = {
    endpoint: 'stats',
    method: 'range',
    args: { id }
  }

  const c = {
    endpoint: 'stamachinets',
    method: 'details',
    args: { id }
  }

  console.log('yesh', hash(a), hash(b), hash(c))

  t.pass()
})
