import React from 'react'
import { Provider, createClient, connect } from '../client'
import test from 'ava'
import ReactDOMServer from 'react-dom/server'

test('ssr', t => {
  const client = createClient({})

  client.set('device.showCats', true)

  const ShowCats = connect(
    ({ data }) => {
      return data
        ? React.createElement('div', {}, 'cats')
        : React.createElement('div', {}, 'no cats!')
    },
    'device.showCats'
  )

  const App = () => {
    return React.createElement(
      Provider,
      { hub: client },
      React.createElement(ShowCats)
    )
  }

  const ouput = ReactDOMServer.renderToString(React.createElement(App))

  t.is(ouput, '<div>cats</div>')

  const cats = client.store.device.showCats
  const first = cats[Object.keys(cats)[0]]

  t.falsy(first.listeners, 'does not add listeners on ssr react')
})
