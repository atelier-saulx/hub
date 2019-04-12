import React, { useReducer, useEffect, useRef } from 'react'
import { createClient, useRpc, Provider } from '../client'
import ReactDOM from 'react-dom'
// import { startCounter, Counter } from './counter'

const emojis = require('./hubServer/emojis')
const totalData = Array.from(Array(50)).map((val, i) => {
  return {
    realIndex: i,
    emoji: emojis[~~(Math.random() * emojis.length - 1)]
  }
})

const client = createClient({
  url: 'ws://localhost:6062'
})

// client.on('connect', s => {
//   console.log('status:', s)
// })

client.set('device.list', totalData)
// manages stuff with realIndex as well
// if you pased range to the server it will add extra payload like checksum
// which is range and it will create an array internally that it tries to fill in
// allways wrap it in objects where you pass 'realindex' ?
// is very handy for lists

const reducer = (s, v) => s + v

const List = () => {
  const element = useRef()
  const [range, dispatch] = useReducer(reducer, 200)

  useEffect(() => {
    const listener = e => {
      if (
        element.current.offsetHeight - 200 <
        document.documentElement.scrollTop + global.innerHeight
      ) {
        dispatch(50)
      }
    }
    document.addEventListener('scroll', listener)
    return () => {
      document.removeEventListener('scroll', listener)
    }
  }, [])

  const data = useRpc(
    {
      endpoint: 'data',
      method: 'list',
      // Math.max(0, range - 50)
      range: [0, range]
    },
    []
  )

  return (
    <div
      ref={element}
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap'
      }}
    >
      {data.length}
      {data.map(val => {
        return (
          <div
            key={'xx' + val.realIndex}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              margin: 10,
              width: 80,
              height: 80,
              fontSize: 20,
              border: '1px solid #ccc'
            }}
          >
            {val.emoji}
            <div style={{ fontSize: 11, marginTop: 5 }}>{val.realIndex}</div>
          </div>
        )
      })}
      <div onClick={() => {}}>ADD ITEM</div>
    </div>
  )
}

const App = () => {
  return (
    <Provider hub={client}>
      <List />
    </Provider>
  )
}

const d = document.createElement('div')

ReactDOM.render(<App />, d)

document.body.appendChild(d)
