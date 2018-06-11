import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from './IframeHandler'

class EditorArbre extends Component {
  constructor (props) {
    super(props)

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

    /**
     * Rassemble les attributs du composant
     * @type {object}
     */
    this.state = {
      importError: null
    }
  }

  /**
   * Charge une ressource
   *
   * @param {Ressource} resource Une Ressource
   */
  loadRessource (resource) {
    this.iframe.current.contentWindow.load(resource, window.options)
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

EditorArbre.propTypes = {
  change: PropTypes.func,
  parametres: PropTypes.object
}

export default formValues({parametres: 'parametres'})(EditorArbre)
