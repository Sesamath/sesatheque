import PropTypes from 'prop-types'
import React, {Component} from 'react'
import config from '../../server/config'

const CHANNEL = 'message'
const SOURCE = (config.application && config.application.baseUrl) || 'http://localhost:3001'

class Iframe extends Component {
  constructor (props) {
    super(props)
    this.iframe = React.createRef()
    this.name = 'sesatheque-iframe'
  }

  componentDidMount () {
    this.registerMessageListener()
  }

  componentWillUnmount () {
    this.unregisterMessageListener()
  }

  emit (message) {
    message.from = this.name
    message.source = SOURCE

    const iframeWindow = this.iframe.current.contentWindow
    iframeWindow.postMessage(message, SOURCE)
  }

  messageHandler (event) {
    let {action, data} = event
    this.props.onMessage(action, data)
  }

  registerMessageListener () {
    if (window.addEventListener) {
      window.addEventListener(CHANNEL, this.messageHandler.bind(this), false)
    } else {
      window.attachEvent(CHANNEL, this.messageHandler.bind(this))
    }
  }

  unregisterMessageListener () {
    if (window.addEventListener) {
      window.removeEventListener(CHANNEL, this.messageHandler.bind(this))
    } else {
      window.detachEvent(CHANNEL, this.messageHandler.bind(this))
    }
  }

  render () {
    return (
      <fieldset>
        <div>
          <iframe ref={this.iframe} src={this.props.src}>
            <p>Votre navigateur semble ne pas supporter les iframes</p>
          </iframe>
        </div>
      </fieldset>
    )
  }
}

Iframe.propTypes = {
  onMessage: PropTypes.func,
  src: PropTypes.string
}

export default Iframe
