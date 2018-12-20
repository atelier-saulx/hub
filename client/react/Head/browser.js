const { createPortal } = require('react-dom')
const React = require('react')

class Head extends React.Component {
  render() {
    let children = this.props.children
    const head = document.head

    if (!Array.isArray(children)) {
      children = [children]
    }

    const initial = head.initial
    if (!initial) {
      const remove = []
      for (
        let i = 0, len = head.childNodes.length, start = false;
        i < len;
        i++
      ) {
        const elem = head.childNodes[i]
        if (elem.nodeType === 8 && elem.nodeValue === 'head') {
          if (start) {
            head.removeChild(elem)
            break
          } else {
            start = true
          }
        }
        if (start) {
          head.removeChild(elem)
          i--
          len--
        }
      }
      remove.forEach(val => {
        head.removeChild(val)
      })
      head.initial = true
    }
    return createPortal(children, head)
  }
}

module.exports = Head
