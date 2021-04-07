import React, { useReducer, useEffect, useRef, useState } from 'react'
import {
  createClient,
  useRpc,
  Provider,
  useHub,
  connect,
  useData
} from '../client'
import ReactDOM from 'react-dom'

const hub = createClient({
  url: 'ws://localhost:6062'
})

hub.debug = true

hub.configure({
  global: {
    incoming: (hub, payload) => {
      console.log('11111x')
      return payload
    },
    send: (hub, payload) => {
      console.log('1111y')
      return payload
    }
  }
})

hub.configure({
  global: {
    incoming: (hub, payload) => {
      console.log('2222x')
      return payload
    },
    send: (hub, payload) => {
      console.log('222y')
      return payload
    }
  }
})

// hub.rpc('data.diff', () => {
//   console.log('received new data!')
//   console.log(hub.get('data.diff'))
// })

const Flap = connect(({ data, hub }) => {
  console.log('go')

  const d = useData('device.snurk', {
    x: true,
    y: true
  })

  const dx = useData('device.snurk', {
    x: true,
    z: true
  })

  const dxy = useData({
    endpoint: 'device',
    method: 'snurk',
    args: { x: true, z: true }
  })

  return (
    <div
      onClick={() => {
        hub.set('device.flap', !data)
      }}
    >
      {data ? 'flap' : 'no flap'}
    </div>
  )
}, 'data.simple')

const App = () => {
  return (
    <Provider hub={hub}>
      <Flap />
    </Provider>
  )
}

const d = document.createElement('div')
ReactDOM.render(<App />, d)
document.body.appendChild(d)
