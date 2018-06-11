import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import Iframe from './Iframe'

class EditorJ3p extends Component {
  constructor (props) {
    super(props)

    /**
     * Callback d'export des données J3P
     * @type {function}
     */
    this.getParameters = null

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
    this.iframeSrc = require('../../client/plugins/j3p/editgraphe.html')
  }

  /**
   * Exporte le contenu de l'éditeur
   */
  exportToJson () {
    const j3pExport = this.getParameters()
    if (!j3pExport) {
      // @todo Ajouter un gestionnaire d'erreur avec feedback
      console.error(new Error('sesaeditgraphe ne remonte aucune info'))
      return
    }

    this.props.change('parametres', j3pExport)
  }

  /**
   * Charge une ressource
   *
   * @param {Ressource} Une Ressource
   */
  loadRessource (resource) {
    this.iframe.current.contentWindow.load(resource, (error, getParametres) => {
      if (error) return // todo: afficher "Une erreur s'est produite pendant le chargement de l'éditeur"
      this.getParameters = getParametres
    })
  }

  /**
   * Appelée au chargement de l'iframe
   *
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
    this.iframe = iframe
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres
    this.loadRessource({parametres})
  }

  /**
   * Appelée lorsque l'éditeur passe du mode manuel au mode édition
   *
   * @param {bool} exitIframe True si l'éditeur sort de son mode édition
   */
  onManualEditorToggle (exitIframe) {
    if (exitIframe) {
      this.exportToJson()
    } else {
      this.iframe.current.src = this.iframeSrc // Recharge la page
    }
  }

  render () {
    return (
      <fieldset>
        <Iframe
          allowManualEdition
          change={this.props.change}
          onLoad={this.onIframeLoaded.bind(this)}
          onToggle={this.onManualEditorToggle.bind(this)}
          src={this.iframeSrc}
        />
      </fieldset>
    )
  }
}

EditorJ3p.propTypes = {
  change: PropTypes.func,
  parametres: PropTypes.object
}

export default formValues({parametres: 'parametres'})(EditorJ3p)
