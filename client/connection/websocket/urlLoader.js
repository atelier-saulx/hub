module.exports = (url, cb) => {
  if (typeof url === 'function') {
    url().then(v => {
      cb(v)
    })
  } else {
    cb(url)
  }
}
