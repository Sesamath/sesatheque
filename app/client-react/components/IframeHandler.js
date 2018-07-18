import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {JsonField} from './fields'

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
      manualEdition: !props.allowManualEdition,
      disableEditor: false
    }
  }

  /**
   * Callback appelé au chargement de l'iframe, on passe alors l'iframe à props.onLoad
   */
  onLoad () {
    this.props.onLoad(this.iframe)
  }

  onManualEditorChange (annotations) {
    if (annotations.length === 0) return this.setState({disableEditor: false})

    let hasErrors = annotations.find(a => a.type === 'error') !== undefined
    this.setState({disableEditor: hasErrors})
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
      // on met à jour le store d'après l'éditeur graphique
      this.props.updateStoreFromEditor()
      // updateStoreFromEditor ne doit plus rien faire (au cas où qqun la rapellerait)
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
              className={!this.state.manualEdition ? 'btn' : 'btn selected'}>Mode texte</button>
            <button
              type="button"
              onClick={this.toggleManualEditor.bind(this, false)}
              className={this.state.manualEdition ? 'btn' : 'btn selected'}
              disabled={this.state.disableEditor}>Éditeur graphique</button>
          </nav>
        ) : null}
        {this.props.allowManualEdition && this.state.manualEdition ? (
          <JsonField
            label="Script"
            name={this.props.name ||
              'parametres'}
            onValidate={this.onManualEditorChange.bind(this)}
          />
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
