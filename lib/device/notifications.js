const notifications = hub => {
  const defaultError = {
    icon: 'error',
    type: 'negative',
    title: 'Error',
    timer: 3e3
  }

  hub.configure({
    device: {
      notifications: {
        default: []
      }
    }
  })

  hub.notification = val => {
    hub.set(
      'device.notifications',
      hub.get('device.notifications').concat([val])
    )
    if (val.timer !== false) {
      setTimeout(() => {
        hub.set(
          'device.notifications',
          hub.get('device.notifications').filter(v => val !== v)
        )
      }, val.timer || 6e3)
    }
  }

  hub.closeNotification = val =>
    hub.set(
      'device.notifications',
      hub.get('device.notifications').filter(v => val !== v)
    )

  hub.error = errors => {
    if (!Array.isArray(errors)) {
      errors = [errors]
    }
    errors.forEach(err => {
      if (err !== null) {
        const msg = typeof err === 'object' ? err.message : err
        const parsedError = Object.assign(
          defaultError,
          typeof err === 'object' ? err : { message: msg },
          (hub.errorCodes && hub.errorCodes[msg]) || hub.errorCodes['*'] || {}
        )
        hub.notification(parsedError)
        hub.emit('device.error', parsedError)
      }
    })
  }
}

module.exports = notifications
