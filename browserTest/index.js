import React, { useReducer, useEffect, useRef, useState } from 'react'
import { createClient, useRpc, Provider, useHub } from '../client'
import ReactDOM from 'react-dom'
// import { startCounter, Counter } from './counter'

const emojis = require('./hubServer/emojis')
const totalData = Array.from(Array(50)).map((val, i) => {
  return {
    realIndex: i,
    emoji: emojis[~~(Math.random() * emojis.length - 1)]
  }
})

const client = (global.hub = createClient({
  url: 'ws://localhost:6062'
}))

// client.on('connect', s => {
//   console.log('status:', s)
// })
const timeout = t =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, t || 500)
  })

client.debug = true

const init = async () => {
  // await timeout(Math.random() * 100)
  const x = await client.rpc({
    endpoint: 'data',
    method: 'simple',
    timeout: 2e3,
    multiplex: true,
    onTimeout: () => {
      console.log('TIMEOUT')
    }
  })

  if (x) {
    console.log('x', x)
  }
}

let i = 100
while (i--) {
  init()
}

// client.set('device.list', totalData)

// client.set(
//   {
//     method: 'a',
//     endpoint: 'device',
//     args: { method: 'a' }
//   },
//   'A!'
// )
// client.set(
//   {
//     method: 'a',
//     endpoint: 'device',
//     args: { method: 'b' }
//   },
//   'B!'
// )

// client
//   .rpc({
//     endpoint: 'data',
//     method: 'list'
//   })
//   .then(val => {
//     console.log('go go go ', val)
//   })

// manages stuff with realIndex as well
// if you pased range to the server it will add extra payload like checksum
// which is range and it will create an array internally that it tries to fill in
// allways wrap it in objects where you pass 'realindex' ?
// is very handy for lists

const ThingInner = ({ mod = 0 }) => {
  const [y, set] = useState('a')
  const x = useRpc(
    {
      endpoint: 'data',
      method: 'complex',
      range: [0, mod + 1],
      args: {
        id: y
      }
    },
    []
  )

  return (
    <div>
      ok ok {mod}
      <button
        style={{
          marginLeft: 100
        }}
        onClick={() => {
          set(y === 'a' ? 'b' : 'a')
        }}
      >
        Diff switch
      </button>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {x.map(val => {
          return (
            <div
              key={'xx' + val.realIndex}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                margin: 1,
                width: 60,
                overflow: 'hidden',
                height: 60,
                fontSize: 12,
                border: '1px solid #ccc'
              }}
            >
              {val.emoji}
              <div style={{ fontSize: 7, marginTop: 5 }}>{val.realIndex}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Thing = () => {
  const [mod, setMod] = useState(1)

  const blax = useRpc(
    {
      endpoint: 'data',
      method: 'complex',
      minLoadTime: 1e3
    },
    { id: mod },
    []
  )

  return (
    <>
      <button
        onClick={() => {
          setMod(mod === 1 ? 0 : 1)
        }}
      >
        SWITHCER
      </button>

      {blax.map(val => mod)}
    </>
  )

  // {/* <ThingInner mod={mod} /> */}
}

// const reducer = (s, v) => s + v

// const List = () => {
//   const element = useRef()
//   const [range, dispatch] = useReducer(reducer, 200)

//   useEffect(() => {
//     const listener = e => {
//       if (
//         element.current.offsetHeight - 200 <
//         document.documentElement.scrollTop + global.innerHeight
//       ) {
//         dispatch(50)
//       }
//     }
//     document.addEventListener('scroll', listener)
//     return () => {
//       document.removeEventListener('scroll', listener)
//     }
//   }, [])

//   const data = useRpc(
//     {
//       endpoint: 'data',
//       method: 'list',
//       // Math.max(0, range - 50)
//       range: [0, range]
//     },
//     []
//   )

//   const hub = useHub()

//   console.log(
//     hub.getStore({
//       endpoint: 'data',
//       method: 'list'
//     })
//   )

//   return (
//     <div
//       ref={element}
//       style={{
//         display: 'flex',
//         flexDirection: 'row',
//         flexWrap: 'wrap'
//       }}
//     >
//       {data.length}
//       {data.map(val => {
//         return (
//           <div
//             key={'xx' + val.realIndex}
//             style={{
//               display: 'flex',
//               justifyContent: 'center',
//               alignItems: 'center',
//               flexDirection: 'column',
//               margin: 10,
//               width: 80,
//               height: 80,
//               fontSize: 20,
//               border: '1px solid #ccc'
//             }}
//           >
//             {val.emoji}
//             <div style={{ fontSize: 11, marginTop: 5 }}>{val.realIndex}</div>
//           </div>
//         )
//       })}
//       <div onClick={() => {}}>ADD ITEM</div>
//     </div>
//   )
// }

// const App = () => {
//   return (
//     <Provider hub={client}>
//       <Thing />
//     </Provider>
//   )
// }

// const d = document.createElement('div')

// ReactDOM.render(<App />, d)

// document.body.appendChild(d)
