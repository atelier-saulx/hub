const store = require('./store')
const Head = ({ children }) => {
  if (!Array.isArray(children)) {
    children = [children]
  }
  store.store.push(...children)
  return null
}

module.exports = Head
