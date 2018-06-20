import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'

class EditorJ3p extends Component {
  constructor (props) {
    super(props)

    /**
     * Retourne les données J3P à mettre dans ressources.parametres (un objet)
     * @type {function}
     */
    this.getParametres = null

    /**
     * Référence React vers l'iframe
     * @type {React.Ref}
     * @see https://reactjs.org/docs/refs-and-the-dom.html
     */
    this.iframe = null

    /**
     * Url de la page contenant l'éditeur de graphe J3P
     * @type {string}
     */
    this.iframeSrc = require('../../client/plugins/j3p/editgraphe.html')

    this.state = {
      manualEdition: false
    }
  }

  /**
   * Exporte le contenu de l'éditeur graphique vers la prop parametres
   */
  exportParametresToProp () {
    let parametres = this.getParametres()
    if (!parametres) {
      // @todo Ajouter un gestionnaire d'erreur avec feedback
      console.error(new Error('sesaeditgraphe ne remonte aucune info'))
      return
    }
    if (typeof parametres === 'string') {
      try {
        parametres = JSON.parse(parametres)
      } catch (error) {
        console.error(new Error('sesaeditgraphe remonte des paramètres invalides'))
        // ajout feedback `Erreur interne, l’éditeur remonte des paramètres invalides`
        return
      }
    }
    this.props.change('parametres', parametres)
  }

  syncFormStore() {
    if (!this.state.manualEdition) {
      this.exportParametresToProp()
    }
  }

  /**
   * Charge une ressource
   * @param {Ressource} ressource La Ressource à charger (seule la propriété parametres est utilisée)
   */
  loadRessource (ressource) {
    // @todo vérifier que this.iframe.current existe et gérer l'erreur éventuelle
    const {syncFormStoreRegister} = this.props
    this.iframe.current.contentWindow.load(ressource, (error, getParametres) => {
      if (error) return // todo: afficher "Une erreur s'est produite pendant le chargement de l'éditeur"
      this.getParametres = getParametres
      syncFormStoreRegister(this.syncFormStore.bind(this))
    })
  }

  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
    this.iframe = iframe
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres
    this.loadRessource({parametres})
  }

  /**
   * Appelée lors d'une bascule de l'éditeur (manuel / graphique)
   * @param {bool} toManual vaut true lors d'une transition graphique => manuel
   */
  onManualEditorToggle (toManual) {
    if (this.state.manualEdition === toManual) return

    this.setState({
      manualEdition: toManual
    })

    if (toManual) {
      this.exportParametresToProp()
    }
  }

  render () {
    return (
      <fieldset>
        <IframeHandler
          allowManualEdition
          change={this.props.change}
          onLoad={this.onIframeLoaded.bind(this)}
          onToggle={this.onManualEditorToggle.bind(this)}
          src={this.iframeSrc}
          manualEdition={this.state.manualEdition}
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
  syncFormStoreRegister: PropTypes.func
}

export default formValues({parametres: 'parametres'})(EditorJ3p)
