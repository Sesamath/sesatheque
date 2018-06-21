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
    if (typeof parametres === 'string') {
      try {
        parametres = JSON.parse(parametres)
      } catch (error) {
        console.error(new Error('mathgraph remonte des paramètres invalides'))
        // ajout feedback `Erreur interne, l’éditeur remonte des paramètres invalides`
        return
      }
    }
    // y'a apparemment parfois un souci avec level
    if (typeof parametres.level !== 'number') {
      parametres.level = Number(parametres.level)
      if (Number.isNan(parametres.level)) {
        // décidément mathgraph renvoie n'importe quoi
        console.error(new Error('level n’est pas du tout un nombre'))
        delete parametres.level
      } else {
        console.error(new Error(`level n’était pas un nombre, on a casté (${parametres.level})`))
      }
    }

    this.props.change('parametres', parametres)
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
      syncFormStoreRegister(this.exportParametresToProp.bind(this))
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

  render () {
    return (
      <fieldset>
        <IframeHandler
          change={this.props.change}
          onLoad={this.onIframeLoaded.bind(this)}
          src={this.iframeSrc}
        />
      </fieldset>
    )
  }
}

EditorMathGraph.propTypes = {
  change: PropTypes.func,
  parametres: PropTypes.object,
  syncFormStoreRegister: PropTypes.func
}

export default formValues({parametres: 'parametres'})(EditorMathGraph)
