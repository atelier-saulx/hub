import React from 'react'
import { Provider, createClient, connect, Switch, Route } from '../client'
import test from 'ava'
import renderer from 'react-test-renderer'

test('.on advanced', t => {
  const client = createClient({
    browser: true
  })

  let fired = { meth1: 0, meth2: 0 }

  // same config for both meth1 and meth2
  const sameConf = {
    on: ['smur.blur'],
    call: (hub, props) => {
      fired[props.method]++
      return props
    }
  }

  client.configure({
    smur: {
      default: 'lullz',
      meth1: sameConf,
      meth2: sameConf
    }
  })

  const Simple2 = connect(
    ({ data }) => {
      return React.createElement('div', {}, data)
    },
    'smur.meth2'
  )

  const Simple = connect(
    ({ data }) => {
      return React.createElement('div', {}, data)
    },
    'smur.meth1'
  )

  const App = () => {
    return React.createElement(
      Provider,
      { hub: client },
      React.createElement(Simple),
      React.createElement(Simple2)
    )
  }

  const tree = renderer.create(React.createElement(App))
  t.snapshot(tree.toJSON())

  t.is(fired.meth1, 1, 'fired meth1 for render')
  t.is(fired.meth2, 1, 'fired meth1 for render')

  client.set('smur.blur', 'random')

  t.is(fired.meth1, 2, 'fired meth1 for listener update')
  t.is(fired.meth2, 2, 'fired meth2 for listener update')
})

test('configure .on option and render', async t => {
  const client = createClient({
    browser: true
  })
  var receiveCnt = 0

  client.configure({
    user: {
      send: false,
      token: false,
      profile: {
        on: 'user.token',
        receive: (hub, props, content, receive) => {
          receiveCnt++
          receive(hub, props, {
            content: hub.get('user.token') ? 'yes' : 'no'
          })
        }
      }
    }
  })

  const Simple = connect(
    ({ data }) => {
      return React.createElement('div', {}, data)
    },
    'user.profile'
  )

  const App = () => {
    return React.createElement(
      Provider,
      { hub: client },
      React.createElement(Simple)
    )
  }

  const tree = renderer.create(React.createElement(App))
  t.snapshot(tree.toJSON())
  client.set('user.token', 'token')
  t.snapshot(tree.toJSON())
  t.is(receiveCnt, 2)
  t.pass()
})

test('unsubscribe', async t => {
  const client = createClient({
    browser: true
  })

  client.configure({
    device: {
      showCats: { default: true }
    },
    animals: {
      cats: { default: ['cat1', 'cat2'] }
    }
  })

  const Simple = connect(
    ({ data }) => {
      return React.createElement('div', {}, data)
    },
    'animals.cats'
  )

  const ShowCats = connect(
    ({ data }) => {
      return data
        ? React.createElement(Simple)
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

  const tree = renderer.create(React.createElement(App))

  client.set('device.showCats', true)
  const cats = client.getStore('animals.cats')

  t.snapshot(tree.toJSON())
  t.truthy(cats.listeners.components)

  client.set('device.showCats', false)
  t.snapshot(tree.toJSON())
  t.falsy(cats.listeners)

  t.pass()
})

// path="/layout/:type/:id" component={Layout}

test('router', t => {
  const client = createClient({
    browser: true
  })

  const Thing = () => {
    return React.createElement(
      Switch,
      {},
      React.createElement(Route, {
        path: '/:id',
        component: ({ match }) => {
          return React.createElement(
            'div',
            {},
            match.query.type + ' ' + match.params.id
          )
        }
      })
    )
  }

  client.set('device.history', '/hello?type=yes')

  const App = () => {
    return React.createElement(
      Provider,
      { hub: client },
      React.createElement(Thing)
    )
  }

  const tree = renderer.create(React.createElement(App))
  t.snapshot(tree.toJSON())
})
