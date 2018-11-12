const ReactDOMServer = require('react-dom/server')
const React = require('react')
const store = require('./store')
module.exports = () => {
  const children = store.store
  store.store = []
  // tmp doing SSR here
  return `<!--head-->
${ReactDOMServer.renderToStaticMarkup(
    React.createElement(React.Fragment, null, children)
  )}
<!--head-->`
}
