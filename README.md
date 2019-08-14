# Hub

![](https://img.shields.io/badge/code_style-standard-brightgreen.svg)

Front end react state management.
Grpc build in over websockets

```javascript
import { createClient } from '@saulx/hub'

const client = createClient()

const fn = () => {
  console.log('fire!')
}

// subscribe
client.rpc(
  {
    endpoint: 'f',
    method: 'subscribe',
    args: { uuid: 'firstname' }
  },
  fn
)

client.close(
  {
    endpoint: 'f',
    method: 'subscribe',
    args: { uuid: 'firstname' }
  },
  fn
)

// one off
const result = await client.rpc('f.subscribe', { hello: true })
```

Use it with react

```javascript
import { useRpc, useHub, Provider, createClient } from '@saulx/hub'
const client = createClient()

const Something = () => {
  // gives access to the hub context
  const hub = useHub()

  // handles unsubscribe / subscribe internally
  const myValue = useRpc('f.subscribe')
  
  // local values are on endpoint device
  const localValue = useRpc('device.value')

  return <div
    onClick={() => hub.set('device.value', Math.floor(Math.random() * 99))}
  >{myValue} {localValue}</div>
}

const App = () => {
  return (
    <Provider hub={client}>
      <Something />
    </Provider>
  )
}
```
