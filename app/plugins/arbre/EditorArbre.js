import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from 'client-react/components/IframeHandler'
import iframeHelper from 'client-react/hoc/iframeHelper'
// page contenant l'éditeur d'arbre à insérer en iframe
import iframeSrc from './public/edit.html'
// cf webpackConfigLoader.js pour les valeurs exportées à un browser
import {baseId} from '../../server/config'

/**
 * Éditeur graphique d'arbre (qui va créer une iframe)
 */
class EditorArbre extends Component {
  /**
   * Synchronise le contenu de l'éditeur graphique avec redux-form
   */
  updateStoreFromEditor () {
    const arbreExport = this.props.getParametres()
    if (!arbreExport) {
      console.error(new Error('le plugin ne remonte aucune info'))
      return
    }

    this.props.change('enfants', arbreExport)
  }

  /**
   * Appelée au chargement de l'iframe
   *
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
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
    const loadCb = this.props.getLoadCb(this.updateStoreFromEditor.bind(this))
    // on peut appeler la méthode load de l'éditeur (pour charger la ressource dedans)
    iframe.current.contentWindow.load(ressource, options, loadCb)
  }

  render () {
    return (
      <fieldset>
        <IframeHandler
          allowManualEdition
          onLoad={this.onIframeLoaded.bind(this)}
          src={iframeSrc}
          updateStoreFromEditor={this.updateStoreFromEditor.bind(this)}
          setUpdateStoreFromEditor={this.props.setUpdateStoreFromEditor}
          name="enfants"
        />
      </fieldset>
    )
  }
}

EditorArbre.propTypes = {
  /** rid éventuel de la branche (l'original a les enfants) */
  aliasOf: PropTypes.string,
  /** Pour mettre à jour enfants, fourni par formValues de redux-form */
  change: PropTypes.func,
  /** La liste des enfants de l'arbre (peut être une string si c'est du json, ça devrait pas…) */
  enfants: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.string
  ]),
  /** Le rid de l'arbre (baseId/oid) */
  rid: PropTypes.string,
  /** titre */
  titre: PropTypes.string,
  /**
   * Pour récupérer une fct à passer comme callback à la fct load du dom de l'iframe (quand l'iframe aura chargé la ressource ça appellera cette callback pour lui passer sa fct getParametres)
   * @param {function} updateStoreFromEditor Notre fonction interne qui modifie props.enfants
   * @return {loadCb}
   */
  getLoadCb: PropTypes.func,
  /** permettant de récupérer les paramètres de l'arbre en cours d'édition, fournie par loadCb, qui est retournée par getLoadCb(updateStoreFromEditor) */
  getParametres: PropTypes.func,
  /** pour affecter la fct qui met à jour le store, fournie par le hoc iframeHelper */
  setUpdateStoreFromEditor: PropTypes.func
}

export default iframeHelper(
  formValues({
    aliasOf: 'aliasOf',
    enfants: 'enfants',
    rid: 'rid',
    titre: 'titre'
  })(EditorArbre)
)

/**
 * Callback de chargement de l'éditeur d'arbre en iframe
 * @typeDef loadCb
 * @param {Error} [error]
 * @param {function} getParametres
 */
