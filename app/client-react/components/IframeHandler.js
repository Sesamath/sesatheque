import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Fields} from 'redux-form'
import Iframe from './fields/inputs/Iframe'
import {TextField} from './fields'

class IframeHandler extends Component {
  constructor (props) {
    super(props)

    this.state = {
      manualEdition: false,
      disableEditor: false
    }
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
          <TextField
            mode="json"
            label="Paramètres"
            name={this.props.textEditorName}
            onValidate={this.onManualEditorChange.bind(this)}
          />
        ) : (
          <Fields
            names={this.props.iframeNames}
            onLoad={this.props.onLoad}
            src={this.props.src}
            component={Iframe}
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
  textEditorName: PropTypes.string,
  root: PropTypes.string,
  iframeNames: PropTypes.arrayOf(PropTypes.string)
}

export default IframeHandler
