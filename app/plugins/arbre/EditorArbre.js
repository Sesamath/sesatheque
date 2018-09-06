import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import {IframeField} from 'client-react/components/fields'
// page contenant l'éditeur d'arbre à insérer en iframe
import iframeSrc from './public/edit.html'
// cf webpackConfigLoader.js pour les valeurs exportées à un browser
import {baseId} from '../../server/config'

/**
 * Éditeur graphique d'arbre (qui va créer une iframe)
 */
class EditorArbre extends Component {
  /**
   * Appelée au chargement de l'iframe
   *
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe, fields) {
    const enfants = typeof this.props.enfants === 'string' ? JSON.parse(this.props.enfants) : this.props.enfants

    const ressource = {
      aliasOf: this.props.aliasOf,
      enfants,
      rid: this.props.rid,
      titre: this.props.titre,
      type: 'arbre'
    }
    const options = {
      baseId
    }

    // on peut appeler la méthode load de l'éditeur (pour charger la ressource dedans)
    iframe.current.contentWindow.load(ressource, options, fields)
  }

  render () {
    return (
      <IframeField
        label="Édition de l'arbre"
        allowManualEdition
        onLoad={this.onIframeLoaded.bind(this)}
        src={iframeSrc}
        name="enfants"
      />
    )
  }
}

EditorArbre.propTypes = {
  /** rid éventuel de la branche (l'original a les enfants) */
  aliasOf: PropTypes.string,
  /** La liste des enfants de l'arbre (peut être une string si c'est du json, ça devrait pas…) */
  enfants: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.string
  ]),
  /** Le rid de l'arbre (baseId/oid) */
  rid: PropTypes.string,
  /** titre */
  titre: PropTypes.string
}

export default formValues({
  aliasOf: 'aliasOf',
  enfants: 'enfants',
  rid: 'rid',
  titre: 'titre'
})(EditorArbre)
