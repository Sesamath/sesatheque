import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'

class EditorMathGraph extends Component {
  constructor (props) {
    super(props)

    /**
     * Retourne les données mathgraph à mettre dans ressources.parametres (un objet)
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
     * Url de la page contenant l'éditeur de mathgraph
     * @type {string}
     */
    this.iframeSrc = require('../../client/plugins/mathgraph/mathgraph-editor.html')
  }

  /**
   * Exporte le contenu de l'éditeur graphique vers la prop parametres
   */
  exportParametresToProp () {
    let parametres = this.getParametres()
    if (!parametres) {
      // @todo Ajouter un gestionnaire d'erreur avec feedback
      console.error(new Error('mathgraph ne remonte aucune info'))
      return
    }
    if (typeof parametres !== 'object' || !parametres.fig) {
      console.error(new Error('mathgraph remonte des paramètres invalides'))
      // ajout feedback `Erreur interne, l’éditeur remonte des paramètres invalides`
      return
    }
    this.props.change('parametres', parametres)
  }

  /**
   * Charge une ressource
   * @param {Ressource} ressource La Ressource à charger (seule la propriété parametres est utilisée)
   */
  loadRessource (ressource) {
    // @todo vérifier que this.iframe.current existe et gérer l'erreur éventuelle
    const {beforeSaveRegister} = this.props
    this.iframe.current.contentWindow.load(ressource, (error, getParametres) => {
      if (error) return // todo: afficher "Une erreur s'est produite pendant le chargement de l'éditeur"
      beforeSaveRegister(getParametres)
      this.getParametres = getParametres
    })
  }

  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
    this.iframe = iframe
    // on est laxiste
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres
    // mais récupérer une string n'est pas normal
    if (typeof this.props.parametres === 'string') console.error(new Error('props.parametres est une string'))
    this.loadRessource({parametres})
  }

  /**
   * Appelée lors d'une bascule de l'éditeur (manuel / graphique)
   * @param {bool} toManual vaut true lors d'une transition graphique => manuel
   */
  onManualEditorToggle (toManual) {
    if (toManual) {
      this.exportParametresToProp()
    } else {
      this.iframe.current.src = this.iframeSrc // Recharge la page
    }
  }

  render () {
    return (
      <fieldset>
        <IframeHandler
          change={this.props.change}
          onLoad={this.onIframeLoaded.bind(this)}
          onToggle={this.onManualEditorToggle.bind(this)}
          src={this.iframeSrc}
        />
      </fieldset>
    )
  }
}

EditorMathGraph.propTypes = {
  change: PropTypes.func,
  parametres: PropTypes.object,
  beforeSaveRegister: PropTypes.func
}

export default formValues({parametres: 'parametres'})(EditorMathGraph)
