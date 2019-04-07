import React from 'react'
import { useHub, useRpc, Provider } from '../client/react/hooks'
import { createClient } from '../client'
import test from 'ava'
import renderer from 'react-test-renderer'

test('hooks api', t => {
  const client = createClient({
    browser: true
  })

  client.set('device.bla', 'bla')

  const Thing = () => {
    const hub = useHub()
    return hub.get('device.bla')
  }

  // console.log('cannot test useEffect so hard to rest useRpc')
  const Thing2 = () => {
    const [, hub] = useRpc('device.bla')
    return hub.get('device.bla')
  }

  const App = () => {
    return React.createElement(
      Provider,
      {
        hub: client
      },
      [
        React.createElement(Thing, { key: 1 }),
        React.createElement(Thing2, { key: 2 })
      ]
    )
  }

  const tree = renderer.create(React.createElement(App))
  t.snapshot(tree.toJSON())
  // console.log(tree.toJSON())

  t.is(true, true)
})
