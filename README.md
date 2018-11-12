# Hub

![](https://img.shields.io/badge/code_style-standard-brightgreen.svg)

Front end react state management.
Grpc build in over websockets

```javascript
import { createClient } from 'hub'

const client = createClient()

const fn = () => {
  console.log('fire!')
}

// subscribe
client.rpc({
  endpoint: 'f',
  method: 'subscribe',
  args: { uuid: 'firstname' }
}, fn)

client.close({
  endpoint: 'f',
  method: 'subscribe',
  args: { uuid: 'firstname' }
}, fn)

// one off
const result = await state.rpc('f.x', { hello: true})
```
