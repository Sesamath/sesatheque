import {Field} from 'redux-form'
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
    this.state = { manualEdition: false }
  }

  componentDidMount () {
    window.addEventListener(CHANNEL, this.messageHandler.bind(this), false)
  }

  componentWillUnmount () {
    window.removeEventListener(CHANNEL, this.messageHandler.bind(this))
  }

  emit (message) {
    message.from = this.name
    message.source = SOURCE

    const iframeWindow = this.iframe.current.contentWindow
    iframeWindow.postMessage(message, SOURCE)
  }

  messageHandler (event) {
    // Mise à jour du textarea
    let {action, data} = event
    this.props.change('parametres', data.toString())

    // Notifie le composant parent
    if (this.props.onMessage) {
      this.props.onMessage(action, data)
    }
  }

  onLoad () {
    if (!this.props.onLoad) return
    this.props.onLoad()
  }

  toggleManualEditor () {
    this.setState({manualEdition: !this.state.manualEdition})
  }

  render () {
    return (
      <fieldset>
        <button onClick={this.toggleManualEditor.bind(this)}>Basculer en mode manuel</button>
        <div style={{display: this.state.manualEdition ? 'block' : 'none'}}>
          <label style={{display: this.props.allowManualEdition ? 'block' : 'none'}}>Script
            <Field
              name="parametres"
              component="textarea"
              cols="80"
              rows="20"
            />
          </label>
        </div>
        <iframe onLoad={this.onLoad.bind(this)} ref={this.iframe} src={this.props.src} style={{display: !this.state.manualEdition ? 'block' : 'none'}}>
          <p>Votre navigateur semble ne pas supporter les iframes</p>
        </iframe>
      </fieldset>
    )
  }
}

Iframe.propTypes = {
  allowManualEdition: PropTypes.bool,
  onMessage: PropTypes.func,
  src: PropTypes.string,
  change: PropTypes.func,
  onLoad: PropTypes.func,
  parametres: PropTypes.object
}

export default Iframe
