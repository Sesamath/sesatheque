import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Field} from 'redux-form'
import Iframe from './inputs/Iframe'
import TextEditor from './inputs/TextEditor'
import addLabel from './hoc/addLabel'

class IframeField extends Component {
  constructor (props) {
    super(props)

    this.state = {
      manualEdition: false,
      disableEditor: false
    }
  }

  onManualEditorChange (annotations) {
    const hasErrors = annotations.some(({type}) => type === 'error')
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
    const isManual = this.props.allowManualEdition && this.state.manualEdition

    return (
      <fieldset>
        {this.props.children}
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
        <Field
          mode="json"
          name={this.props.name}
          onValidate={this.onManualEditorChange.bind(this)}
          onLoad={this.props.onLoad}
          src={this.props.src}
          component={isManual ? TextEditor : Iframe}
        />
      </fieldset>
    )
  }
}

IframeField.propTypes = {
  allowManualEdition: PropTypes.bool,
  src: PropTypes.string,
  onLoad: PropTypes.func,
  name: PropTypes.string,
  children: PropTypes.node
}

export default addLabel(IframeField, 'div')
