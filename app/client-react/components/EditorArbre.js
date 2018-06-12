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
    this.getParametres = null

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
  }

  /**
   * Exporte le contenu de l'éditeur
   */
  exportToJson () {
    const arbreExport = this.getParametres()
    if (!arbreExport) {
      console.error(new Error('le plugin ne remonte aucune info'))
      return
    }

    this.props.change('parametres', arbreExport)
  }

  /**
   * Charge une ressource
   *
   * @param {Ressource} resource Une Ressource
   */
  loadRessource (resource) {
    this.iframe.current.contentWindow.load(resource, window.options, (error, getParametres) => {
      if (error) return // todo: afficher "Une erreur s'est produite pendant le chargement de l'éditeur"
      this.getParametres = getParametres
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
    this.loadRessource({
      parametres,
      rid: this.props.rid,
      alias: this.props.aliasOf,
      type: 'arbre'
    })
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
        <IframeHandler
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

EditorArbre.propTypes = {
  change: PropTypes.func,
  parametres: PropTypes.object,
  rid: PropTypes.string,
  aliasOf: PropTypes.string
}

export default formValues({
  parametres: 'parametres',
  rid: 'rid',
  aliasOf: 'aliasOf'
})(EditorArbre)
