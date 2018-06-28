import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'
import iframeHelper from './iframeHelper'

/**
 * Url de la page contenant l'éditeur de graphe J3P
 * @type {string}
 */
const iframeSrc = require('../../client/plugins/ecjs/edit.html')

class EditorEcjs extends Component {
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
    // on appelle (en global dans l'iframe) load(ressource, cb) qui rappellera cb(getParametres)
    iframe.current.contentWindow.load({parametres}, this.props.onLoadCb(this.updateStoreFromEditor.bind(this)))
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

EditorEcjs.propTypes = {
  // ces deux props sont fournies par ResourceForm
  change: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func,
  // ça c'est redux-form
  parametres: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  // iframeHelper ajoute ces deux props (la 2e est dans son state, mise par la première)
  onLoadCb: PropTypes.func,
  getParametres: PropTypes.func
}

export default iframeHelper(
  formValues({parametres: 'parametres'})(EditorEcjs)
)
