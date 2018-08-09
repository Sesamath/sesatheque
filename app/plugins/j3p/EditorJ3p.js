import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from 'client-react/components/IframeHandler'
import iframeHelper from 'client-react/hoc/iframeHelper'
// page de l'éditeur j3p à insérer en iframe
import iframeSrc from './public/editgraphe.html'

class EditorJ3p extends Component {
  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe, fields) {
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres

    iframe.current.contentWindow.load({parametres}, fields)
  }

  render () {
    return (
      <fieldset>
        <IframeHandler
          allowManualEdition
          onLoad={this.onIframeLoaded.bind(this)}
          src={iframeSrc}
          name="parametres"
          names={[
            'parametres'
          ]}
          root="parametres"
        />
      </fieldset>
    )
  }
}

EditorJ3p.propTypes = {
  parametres: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ])
}

export default iframeHelper(formValues({parametres: 'parametres'})(EditorJ3p))
