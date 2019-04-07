const djb2 = (str, hash = 5381) => {
  var i = str.length
  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash
}

const argHasher = (obj, hash = 5381) => {
  let keyId = 0
  for (let key in obj) {
    const field = obj[key]
    const type = typeof field
    if (type === 'string') {
      hash = (djb2(field, hash) * 33) ^ ++keyId
    } else if (type === 'number') {
      hash = (((hash * 33) ^ field) * 33) ^ ++keyId
    } else if (type === 'object') {
      if (field) {
        hash = argHasher(field, hash)
      }
    } else if (type === 'boolean') {
      hash = (((hash * 33) ^ (field === true ? 1 : 0)) * 33) ^ ++keyId
    }
  }
  return hash
}

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
