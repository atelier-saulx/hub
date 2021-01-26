const a = require('@saulx/utils')
const { stringHash: djb2, hashObject: argHasher } = a

const hash = props => {
  let hashed = djb2(props.endpoint, djb2(props.method))
  if (props.args !== void 0) {
    hashed = argHasher(props.args, hashed)
  }
  return hashed >>> 0
}

exports.hash = hash
exports.argHasher = argHasher
exports.djb2 = djb2
