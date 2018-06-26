import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'
import iframeHelper from './iframeHelper'

/**
 * Page contenant l'éditeur d'arbres
 * @type {string}
 */
const iframeSrc = require('../../client/plugins/arbre/iframe.html')

class EditorArbre extends Component {
  /**
   * Synchronise le contenu de l'éditeur graphique avec redux-form
   */
  updateStoreFromEditor () {
    const arbreExport = this.props.getParametres()
    if (!arbreExport) {
      console.error(new Error('le plugin ne remonte aucune info'))
      return
    }

    this.props.change('enfants', arbreExport)
  }

  /**
   * Appelée au chargement de l'iframe
   *
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
    const enfants = typeof this.props.enfants === 'string' ? JSON.parse(this.props.enfants) : this.props.enfants

    const ressource = {
      alias: this.props.aliasOf,
      enfants,
      rid: this.props.rid,
      titre: this.props.titre,
      type: 'arbre'
    }

    iframe.current.contentWindow.load(ressource, window.options, this.props.onLoadCb(this.updateStoreFromEditor.bind(this)))
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
          name="enfants"
        />
      </fieldset>
    )
  }
}

EditorArbre.propTypes = {
  aliasOf: PropTypes.string,
  change: PropTypes.func,
  enfants: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.string
  ]),
  rid: PropTypes.string,
  titre: PropTypes.string,
  onLoadCb: PropTypes.func,
  getParametres: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func
}

export default iframeHelper(formValues({
  aliasOf: 'aliasOf',
  enfants: 'enfants',
  rid: 'rid',
  titre: 'titre'
})(EditorArbre))
