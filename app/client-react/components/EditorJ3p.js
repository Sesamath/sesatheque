import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'
import addNotifyToProps from '../utils/addNotifyToProps'

/**
 * Url de la page contenant l'éditeur de graphe J3P
 * @type {string}
 */
const iframeSrc = require('../../client/plugins/j3p/editgraphe.html')

class EditorJ3p extends Component {
  constructor (props) {
    super(props)

    /**
     * Retourne les données J3P à mettre dans ressources.parametres (un objet)
     * @type {function}
     */
    this.getParametres = null
  }

  /**
   * Synchronise le contenu de l'éditeur graphique avec redux-form
   */
  syncFormStore () {
    let parametres = this.getParametres()
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
    const {syncFormStoreRegister} = this.props
    iframe.current.contentWindow.load({parametres}, (error, getParametres) => {
      if (error) {
        return this.props.notify({
          level: 'error',
          message: `Une erreur s’est produite pendant le chargement de l’éditeur: ${error.message}`
        })
      }
      this.getParametres = getParametres
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
  syncFormStoreRegister: PropTypes.func,
  notify: PropTypes.func
}

export default addNotifyToProps(formValues({parametres: 'parametres'})(EditorJ3p))
