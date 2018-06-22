import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'
import addNotifyToProps from '../utils/addNotifyToProps'

/**
 * Page contenant l'éditeur de graphe J3P
 * @type {string}
 */
const iframeSrc = require('../../client/plugins/arbre/iframe.html')

class EditorArbre extends Component {
  constructor (props) {
    super(props)

    /**
     * Callback d'export des données de l'arbre
     * @todo Utiliser les postMessage
     * @type {function}
     */
    this.getEnfants = null
  }

  /**
   * Synchronise le contenu de l'éditeur graphique avec redux-form
   */
  syncFormStore () {
    const arbreExport = this.getEnfants()
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

    const {syncFormStoreRegister} = this.props
    iframe.current.contentWindow.load(ressource, window.options, (error, getEnfants) => {
      if (error) {
        return this.props.notify({
          level: 'error',
          message: `Une erreur s’est produite pendant le chargement de l’éditeur: ${error.message}`
        })
      }
      this.getEnfants = getEnfants
      syncFormStoreRegister(this.syncFormStore.bind(this))
    })
  }

  render () {
    return (
      <fieldset>
        <IframeHandler
          allowManualEdition
          onLoad={this.onIframeLoaded.bind(this)}
          src={iframeSrc}
          syncFormStore={this.syncFormStore.bind(this)}
          syncFormStoreRegister={this.props.syncFormStoreRegister}
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
  syncFormStoreRegister: PropTypes.func,
  notify: PropTypes.func
}

export default addNotifyToProps(formValues({
  aliasOf: 'aliasOf',
  enfants: 'enfants',
  rid: 'rid',
  titre: 'titre'
})(EditorArbre))
