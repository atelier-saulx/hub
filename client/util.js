const deepNotEqual = (a, b) => {
  const typeA = typeof a
  const typeB = typeof b
  if (a === b) return false
  if (typeA !== typeB) return true
  if (a === null || b === null) return true
  if (typeA !== 'object') {
    if (typeA === 'function') {
      if (a.toString() !== b.toString()) {
        return true
      }
    } else if (a !== b) {
      return true
    }
  } else {
    if (Array.isArray(a)) {
      if (Array.isArray(b)) {
        const len = a.length
        if (len !== b.length) {
          return true
        }
        for (let i = 0; i < len; i++) {
          const t = typeof a[i]
          // eslint-disable-next-line
          if (typeof b[i] !== t) {
            return true
          } else if (t === 'object') {
            if (deepNotEqual(a[i], b[i])) {
              return true
            }
          }
        }
      } else {
        return true
      }
    }

    if (a.checksum || b.checksum) {
      if (a.checksum !== b.checksum) {
        return true
      } else {
        return false
      }
    }

    let cnt = 0
    for (let key in a) {
      if (key[0] === '_') continue
      if (!a.hasOwnProperty(key)) continue
      if (!b.hasOwnProperty(key)) return true
      const k = b[key]
      if (k === void 0) return true
      const t = typeof k
      const k1 = a[key]
      // eslint-disable-next-line
      if (t !== typeof k1) {
        return true
      } else if (k && t === 'object') {
        if (deepNotEqual(k1, k)) {
          return true
        }
      } else if (k !== k1) {
        return true
      }
      cnt++
    }
    // eslint-disable-next-line
    for (let key in b) {
      cnt--
      if (cnt < 0) {
        return true
      }
    }
  }
  return false
}

const mergeObj = (a, b, k, p) => {
  let changed = false
  if (Array.isArray(a)) {
    if (Array.isArray(b) && b.length < a.length) {
      p[k] = b
      changed = true
    } else {
      let arrayCorrection = 0
      for (let key in b) {
        let k = key * 1 - arrayCorrection
        if (
          a[k] &&
          typeof a[k] === 'object' &&
          b[key] &&
          typeof b[key] === 'object'
        ) {
          if (mergeObj(a[k], b[key], k, a)) {
            changed = true
          }
        } else {
          if (a[k] === void 0 && a.length <= k) {
            a.push(b[key])
            changed = true
          } else {
            if (deepNotEqual(a[k], b[key])) {
              changed = true
            }
            a[k] = b[key]
          }
        }
      }
    }
  } else {
    for (let key in b) {
      if (
        a[key] &&
        typeof a[key] === 'object' &&
        b[key] &&
        typeof b[key] === 'object'
      ) {
        if (mergeObj(a[key], b[key], key, a)) {
          changed = true
        }
      } else {
        if (a[key] !== void 0) {
          if (b[key] === null) {
            delete a[key]
            changed = true
          } else {
            if (deepNotEqual(a[key], b[key])) {
              changed = true
            }
            a[key] = b[key]
          }
        } else {
          a[key] = b[key]
          changed = true
        }
      }
    }
  }
  return changed
}

exports.mergeObj = mergeObj
exports.deepNotEqual = deepNotEqual
