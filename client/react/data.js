const { getLocal } = require('../getLocal')

const parseData = (hub, props, value) => {
  return value || getLocal(hub, props)
}

exports.parseData = parseData
