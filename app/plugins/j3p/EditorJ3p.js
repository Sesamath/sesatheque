import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import {IframeField} from 'client-react/components/fields'
// page de l'éditeur j3p à insérer en iframe
import iframeSrc from './public/editgraphe.html'

class EditorJ3p extends Component {
  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframeRef, fields) {
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres

    iframeRef.current.contentWindow.load({parametres}, fields)
  }

  render () {
    return (
      <IframeField
        label="Édition des paramètres j3p"
        allowManualEdition
        onLoad={this.onIframeLoaded.bind(this)}
        src={iframeSrc}
        name="parametres"
      />
    )
  }
}

EditorJ3p.propTypes = {
  parametres: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ])
}

export default formValues({parametres: 'parametres'})(EditorJ3p)
