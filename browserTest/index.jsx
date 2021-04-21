import React, { useReducer, useEffect, useRef, useState } from 'react'
import { createClient, Provider, useHub, connect, useData } from '../client'
import ReactDOM from 'react-dom'

const hub = createClient({
  url: 'ws://localhost:6062'
})

hub.debug = true

hub.configure({
  global: {
    incoming: (hub, payload) => {
      return payload
    },
    send: (hub, payload) => {
      return payload
    }
  }
})

// hub.rpc('data.diff', () => {
//   console.log('received new data!')
//   console.log(hub.get('data.diff'))
// })

// need to test range with delete

const Flap = ({ data, hub }) => {
  const list = useData({
    endpoint: 'data',
    method: 'list',
    range: [0, 10]
  })

  return (
    <div
      onClick={() => {
        hub.set('device.flap', !data)
      }}
    >
      {data ? 'flap' : 'no flap'}
      {list
        ? list.map((v, i) => {
            return (
              <div key={i}>
                {v.realIndex} {v.emoji}
              </div>
            )
          })
        : null}
    </div>
  )
}

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
