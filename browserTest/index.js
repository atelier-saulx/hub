import React, { useReducer, useEffect, useRef, useState } from 'react'
import { createClient, useRpc, Provider, useHub } from '../client'
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

const List = () => {
  const d = useRpc('data.diff', void 0, {})
  if (!d.a) {
    return 'loading...'
  }
  return (
    <>
      <pre>{JSON.stringify(d, false, 2)}</pre>
      {d.a[1].items.map((v, i) => (
        <div
          key={i}
          style={{
            marginTop: 20
          }}
        >
          {v.name}
        </div>
      ))}
    </>
  )
}

const App = () => {
  return (
    <Provider hub={hub}>
      <List />
    </Provider>
  )
}

const d = document.createElement('div')
ReactDOM.render(<App />, d)
document.body.appendChild(d)
