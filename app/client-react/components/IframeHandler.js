import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Field} from 'redux-form'
import config from '../../server/config'

const CHANNEL = 'message'
const SOURCE = (config.application && config.application.baseUrl) || 'http://localhost:3001'

class IframeHandler extends Component {
  constructor (props) {
    super(props)

    /**
     * Référence React vers l'iframe
     * @type {React.Ref}
     * @see https://reactjs.org/docs/refs-and-the-dom.html
     */
    this.iframe = React.createRef()

    /**
     * Nom/identifiant de l'iframe
     * @type {string}
     */
    this.name = 'sesatheque-iframe'

    /**
     * Rassemble les attributs du composant
     * @type {object}
     */
    this.state = {
      manualEdition: false
    }
  }

  componentDidMount () {
    window.addEventListener(CHANNEL, this.messageHandler.bind(this), false)
  }

  componentWillUnmount () {
    window.removeEventListener(CHANNEL, this.messageHandler.bind(this))
  }

  /**
   * Transmet un mesasge à l'iframe
   * @param {object} message Message à transmettre à l'iframe
   */
  emit (message) {
    message.from = this.name
    message.source = SOURCE

    const iframeWindow = this.iframe.current.contentWindow
    iframeWindow.postMessage(message, SOURCE)
  }

  /**
   * Formate le contenu du textarea
   *
   * @param {object} value Un objet JSON
   * @return {string} Une chaine de caractères
   */
  formatTextarea (value) {
    if (typeof value === 'string') return value

    try {
      return JSON.stringify(value, null, 2)
    } catch (error) {
      console.error(error)
      return ''
    }
  }

  /**
   * Appelé par l'iframe lors d'un postMessage.
   *
   * @param {MessageEvent} event Event lié au postMessage
   */
  messageHandler (event) {
    try {
      const dataStringified = JSON.stringify(event.data)
      this.props.change('parametres', dataStringified)

      // Notifie le composant parent
      if (this.props.onMessage) {
        this.props.onMessage(event.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Callback appelé au chargement de l'iframe
   */
  onLoad () {
    if (!this.props.onLoad) return
    this.props.onLoad(this.iframe)
  }

  /**
   * Change le mode d'édition
   * @param {bool} manualEdition True pour passer en mode édition
   */
  toggleManualEditor (manualEdition) {
    if (this.props.onToggle) this.props.onToggle(manualEdition)
    this.setState({manualEdition})
  }

  render () {
    return (
      <fieldset>
        <nav className="tabs-menu" style={{display: this.props.allowManualEdition ? 'block' : 'none'}}>
          <button
            type="button"
            onClick={this.toggleManualEditor.bind(this, true)}
            className={!this.state.manualEdition ? 'inactive' : ''}>Mode manuel</button>
          <button
            type="button"
            onClick={this.toggleManualEditor.bind(this, false)}
            className={this.state.manualEdition ? 'inactive' : ''}>Éditeur</button>
        </nav>

        <div style={{display: this.state.manualEdition ? 'block' : 'none'}}>
          <label style={{display: this.props.allowManualEdition ? 'block' : 'none'}}>Script
            <Field
              name="parametres"
              component="textarea"
              cols="80"
              rows="20"
              format={this.formatTextarea}
            />
          </label>
        </div>
        <iframe
          onLoad={this.onLoad.bind(this)}
          ref={this.iframe}
          src={this.props.src}
          style={{display: !this.state.manualEdition ? 'block' : 'none'}}>
          <p>Votre navigateur semble ne pas supporter les iframes</p>
        </iframe>
      </fieldset>
    )
  }
}

IframeHandler.propTypes = {
  allowManualEdition: PropTypes.bool,
  onMessage: PropTypes.func,
  src: PropTypes.string,
  change: PropTypes.func,
  onLoad: PropTypes.func,
  onToggle: PropTypes.func
}

export default IframeHandler
