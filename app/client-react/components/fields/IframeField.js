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
      disableGraphicEditor: false
    }
  }

  // passé au onValidate de TextEditor, on bloque le passage au graphique
  // si y'a des erreurs dans le mode texte
  onManualEditorChange (annotations) {
    const hasErrors = annotations.some(({type}) => type === 'error')
    this.setState({disableGraphicEditor: hasErrors})
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

    // Field (https://redux-form.com/8.2.2/docs/api/field.md/) veut un name (couplé au state redux)
    // et un component, il passe toutes les autres props au component
    return (
      <fieldset>
        {this.props.children}
        {this.props.allowManualEdition
          // les boutons manuel / graphique
          ? (
            <nav className="tabs-menu">
              <button
                type="button"
                onClick={this.toggleManualEditor.bind(this, true)}
                className={!this.state.manualEdition ? 'btn' : 'btn selected'}>Mode texte</button>
              <button
                type="button"
                onClick={this.toggleManualEditor.bind(this, false)}
                className={this.state.manualEdition ? 'btn' : 'btn selected'}
                disabled={this.state.disableGraphicEditor}>Éditeur graphique</button>
            </nav>
          )
          // sinon graphique only
          : null
        }
        {isManual
          ? (
            <Field
              name={this.props.name}
              component={TextEditor}
              mode="json"
              onValidate={this.onManualEditorChange.bind(this)}
            />
          ) : (
            <Field
              name={this.props.name}
              component={Iframe}
              onLoad={this.props.onLoad}
              src={this.props.src}
            />
          )
        }
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

export default addLabel(IframeField, false)
