import React, { useReducer, useEffect, useRef, useState } from 'react'
import { createClient, useRpc, Provider, useHub } from '../client'
import ReactDOM from 'react-dom'

const hub = createClient({
  url: 'ws://localhost:6062'
})

hub.rpc('data.diff', () => {
  console.log('received new data!')
  console.log(hub.get('data.diff'))
})

const App = () => {
  return <div>test it now</div>
}

const d = document.createElement('div')
ReactDOM.render(<App />, d)
document.body.appendChild(d)
