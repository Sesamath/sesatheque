import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Field} from 'redux-form'
import config from '../../server/config'

const MESSAGE_CHANNEL = 'message'
const SOURCE = config.application && config.application.baseUrl

class IframeWithMessageHandler extends Component {
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
  }

  componentDidMount () {
    window.addEventListener(MESSAGE_CHANNEL, this.messageHandler.bind(this), false)
  }

  componentWillUnmount () {
    window.removeEventListener(MESSAGE_CHANNEL, this.messageHandler.bind(this))
  }

  /**
   * Transmet un message à l'iframe
   * @param {object} message Message à transmettre à l'iframe
   */
  emit (message) {
    message.from = this.name
    message.source = SOURCE

    const iframeWindow = this.iframe.current.contentWindow
    iframeWindow.postMessage(message, SOURCE)
  }

  /**
   * Formate un objet en string json (pretty)
   * @param {object|string} value Un objet (si string elle sera retournée telle quelle)
   * @return {string} La chaîne de caractères formattée en "pretty" json ({} si value n'était pas un objet stringifiable)
   */
  formatTextarea (value) {
    if (typeof value === 'string') return value

    try {
      return JSON.stringify(value, null, 2)
    } catch (error) {
      console.error(error)
      return '{}'
    }
  }

  /**
   * Listener de message (sera appelé par l'iframe lors d'un postMessage)
   * @param {MessageEvent} event Event lié au message (de postMessage)
   */
  messageHandler (event) {
    if (!event || !event.data) return console.error(new Error('messageHandler appelé sans MessageEvent'))
    if (event.data.action !== 'setParametres') return // pas pour nous
    // @todo pour les erreurs qui suivent, ajouter un feedback utilisateur `Message incohérent, impossible de mettre à jour la ressource` + bugsnag
    if (!event.data.parametres) return console.error(new Error('message avec action setParametres sans parametres'))
    if (typeof event.data.parametres !== 'object') return console.error(new Error('parametres doit être un objet (pour l’action setParametres)'))
    this.props.change('parametres', event.data.parametres)
    // Pourquoi notifier le composant parent ? Il mettra un écouteur sur message s'il veut être au courant (ça lui permettra de sélectionner les messages qui l'intéresse)
    // if (this.props.onMessage) this.props.onMessage(event.data)
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
  }

  render () {
    return (
      <fieldset>
        <nav className="tabs-menu" style={{display: this.props.allowManualEdition ? 'block' : 'none'}}>
          <button
            type="button"
            onClick={this.toggleManualEditor.bind(this, true)}
            className={!this.props.manualEdition ? 'inactive' : ''}>Mode texte</button>
          <button
            type="button"
            onClick={this.toggleManualEditor.bind(this, false)}
            className={this.props.manualEdition ? 'inactive' : ''}>Éditeur graphique</button>
        </nav>
        {this.props.manualEdition ? (
          <div>
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
        ) : (
          <iframe
            onLoad={this.onLoad.bind(this)}
            ref={this.iframe}
            src={this.props.src}
          >
            <p>Votre navigateur ne semble pas gérer les iframes</p>
          </iframe>
        )}
      </fieldset>
    )
  }
}

IframeWithMessageHandler.propTypes = {
  allowManualEdition: PropTypes.bool,
  // onMessage: PropTypes.func,
  src: PropTypes.string,
  change: PropTypes.func,
  onLoad: PropTypes.func,
  onToggle: PropTypes.func,
  manualEdition: PropTypes.bool
}

export default IframeWithMessageHandler
