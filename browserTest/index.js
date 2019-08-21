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

const client = createClient({
  url: 'ws://localhost:6062'
})

// client.on('connect', s => {
//   console.log('status:', s)
// })

// client.debug = true

client.set('device.list', totalData)

client.set(
  {
    method: 'a',
    endpoint: 'device',
    args: { method: 'a' }
  },
  'A!'
)
client.set(
  {
    method: 'a',
    endpoint: 'device',
    args: { method: 'b' }
  },
  'B!'
)

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

client.set('device.width', 100, true)

reduce = (s, a) => {
  return s === 1 ? 0 : 1
}

const Thing = () => {
  const [mod, setMod] = useReducer(reduce, 1)
  const [s, stop] = useState(0)
  const hub = useHub()

  useEffect(() => {
    let cnt = 1000
    let s = setInterval(() => {
      cnt--
      if (!cnt) {
        clearInterval(s)
      }
      setMod()
    }, 100)
  }, [])

  const maxWidth = hub.get('device.width') + 50

  const blax = useRpc(
    {
      endpoint: 'data',
      method: 'complex',
      minLoadTime: 20
    },
    { id: mod },
    []
  )

  return (
    <>
      <button
        onClick={() => {
          setMod(true)
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

const App = () => {
  return (
    <Provider hub={client}>
      <Thing />
    </Provider>
  )
}

const d = document.createElement('div')

ReactDOM.render(<App />, d)

document.body.appendChild(d)
