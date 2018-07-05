import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'
import iframeHelper from '../hoc/iframeHelper'
import iframeSrc from '../../client/plugins/j3p/editgraphe.html'

class EditorJ3p extends Component {
  /**
   * Synchronise le contenu de l'éditeur graphique avec redux-form
   */
  updateStoreFromEditor () {
    let parametres = this.props.getParametres()
    if (!parametres) {
      // @todo Ajouter un gestionnaire d'erreur avec feedback
      console.error(new Error('sesaeditgraphe ne remonte aucune info'))
      return
    }

    this.props.change('parametres', parametres)
  }

  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres
    iframe.current.contentWindow.load({parametres}, this.props.getLoadCb(this.updateStoreFromEditor.bind(this)))
  }

  render () {
    return (
      <fieldset>
        <IframeHandler
          allowManualEdition
          onLoad={this.onIframeLoaded.bind(this)}
          src={iframeSrc}
          updateStoreFromEditor={this.updateStoreFromEditor.bind(this)}
          setUpdateStoreFromEditor={this.props.setUpdateStoreFromEditor}
        />
      </fieldset>
    )
  }
}

EditorJ3p.propTypes = {
  change: PropTypes.func,
  parametres: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  getLoadCb: PropTypes.func,
  getParametres: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func
}

export default iframeHelper(formValues({parametres: 'parametres'})(EditorJ3p))
