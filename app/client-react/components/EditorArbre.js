import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'

class EditorArbre extends Component {
  constructor (props) {
    super(props)

    /**
     * Callback d'export des données de l'arbre
     * @todo Utiliser les postMessage
     * @type {function}
     */
    this.getEnfants = null

    /**
     * Référence React vers l'iframe
     * @type {React.Ref}
     * @see https://reactjs.org/docs/refs-and-the-dom.html
     */
    this.iframe = null

    /**
     * Page contenant l'éditeur de graphe J3P
     * @type {string}
     */
    this.iframeSrc = require('../../client/plugins/arbre/iframe.html')

    this.state = {
      manualEdition: false
    }
  }

  /**
   * Exporte le contenu de l'éditeur
   */
  exportParametresToProp () {
    const arbreExport = this.getEnfants()
    if (!arbreExport) {
      console.error(new Error('le plugin ne remonte aucune info'))
      return
    }

    this.props.change('enfants', arbreExport)
    this.props.change('parametres', arbreExport)
  }

  /**
   * Exporte le contenu de l'éditeur vers le store
   * redux-form si on est en mode graphique
   */
  syncFormStore () {
    if (!this.state.manualEdition) {
      this.exportParametresToProp()
    }
  }

  /**
   * Charge une ressource
   *
   * @param {Ressource} resource Une Ressource
   */
  loadRessource (resource) {
    const {syncFormStoreRegister} = this.props
    this.iframe.current.contentWindow.load(resource, window.options, (error, getEnfants) => {
      if (error) return // todo: afficher "Une erreur s'est produite pendant le chargement de l'éditeur"
      this.getEnfants = getEnfants
      syncFormStoreRegister(this.syncFormStore.bind(this))
    })
  }

  /**
   * Appelée au chargement de l'iframe
   *
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
    this.iframe = iframe

    this.loadRessource({
      alias: this.props.aliasOf,
      enfants: this.props.enfants,
      rid: this.props.rid,
      titre: this.props.titre,
      type: 'arbre'
    })
  }

  /**
   * Appelée lorsque l'éditeur passe du mode manuel au mode édition
   *
   * @param {bool} exitIframe True si l'éditeur sort de son mode édition
   */
  onManualEditorToggle (exitIframe) {
    if (this.state.manualEdition === exitIframe) return

    this.setState({
      manualEdition: exitIframe
    })

    if (exitIframe) {
      this.exportParametresToProp()
    } else {
      // Transfère le contenu du textarea vers l'attribut "enfants" afin d'avoir une iframe à jour
      let enfants
      try {
        enfants = JSON.parse(this.props.parametres)
      } catch (error) {
        console.error(new Error('mathgraph remonte des paramètres invalides'))
        return
      }

      this.props.change('enfants', enfants)
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

EditorArbre.propTypes = {
  aliasOf: PropTypes.string,
  change: PropTypes.func,
  enfants: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.string
  ]),
  parametres: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  rid: PropTypes.string,
  titre: PropTypes.string,
  syncFormStoreRegister: PropTypes.func
}

export default formValues({
  aliasOf: 'aliasOf',
  enfants: 'enfants',
  parametres: 'parametres',
  rid: 'rid',
  titre: 'titre'
})(EditorArbre)
