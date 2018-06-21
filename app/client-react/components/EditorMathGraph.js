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
    // getParametres correspond au mtgApp.getResult()
    let parametres = this.getParametres()
    // console.log('retour de mtgApp.getResult()', parametres)
    if (!parametres) throw new Error('mathgraph ne remonte aucune info')
    let {fig, level} = parametres
    if (!fig || typeof fig !== 'string') throw new Error('mathgraph ne renvoie pas la figure')
    if (!level || typeof level !== 'number' || !Number.isInteger(level) || level < 0) {
      console.error(new Error('level n’est pas un entier positif ou nul (on le fixe à 3)'))
      // en attendant que ce soit réglé on le fixe arbitrairement à 3
      level = 3
    }
    // on teste pas la propriété score inutilisée ici

    this.props.change('parametres', {fig, level})
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
