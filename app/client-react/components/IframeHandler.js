import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Field} from 'redux-form'

class IframeHandler extends Component {
  constructor (props) {
    super(props)

    /**
     * Référence React vers l'iframe
     * @type {React.Ref}
     * @see https://reactjs.org/docs/refs-and-the-dom.html
     */
    this.iframe = React.createRef()

    this.state = {
      manualEdition: false
    }
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
   * Callback appelé au chargement de l'iframe, on passe alors l'iframe à props.onLoad
   */
  onLoad () {
    this.props.onLoad(this.iframe)
  }

  /**
   * Appelée lors d'une bascule de l'éditeur (manuel / graphique)
   * @param {bool} toManual vaut true lors d'une transition graphique => manuel
   */
  toggleManualEditor (toManual) {
    if (this.state.manualEdition === toManual) return

    this.setState({
      manualEdition: toManual
    })

    if (toManual) {
      this.props.updateStoreFromEditor()
      this.props.setUpdateStoreFromEditor(() => {})
    }
  }

  render () {
    return (
      <fieldset>
        {this.props.allowManualEdition ? (
          <nav className="tabs-menu">
            <button
              type="button"
              onClick={this.toggleManualEditor.bind(this, true)}
              className={!this.state.manualEdition ? 'inactive' : ''}>Mode manuel</button>
            <button
              type="button"
              onClick={this.toggleManualEditor.bind(this, false)}
              className={this.state.manualEdition ? 'inactive' : ''}>Éditeur</button>
          </nav>
        ) : null}
        {this.props.allowManualEdition && this.state.manualEdition ? (
          <div>
            <label>Script
              <Field
                name={this.props.name ||
                  'parametres'}
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
          />
        )}
      </fieldset>
    )
  }
}

IframeHandler.propTypes = {
  allowManualEdition: PropTypes.bool,
  src: PropTypes.string,
  onLoad: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func,
  updateStoreFromEditor: PropTypes.func,
  name: PropTypes.string
}

export default IframeHandler
