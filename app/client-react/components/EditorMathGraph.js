import PropTypes from 'prop-types'
import React, {Fragment, Component} from 'react'
import {formValues, Field} from 'redux-form'
import IframeHandler from './IframeHandler'
import iframeHelper from '../hoc/iframeHelper'
import {IntegerField} from './fields'

/**
 * Url de la page contenant l'éditeur de mathgraph
 * @type {string}
 */
const iframeSrc = require('../../client/plugins/mathgraph/mathgraph-editor.html')

class EditorMathGraph extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showReloadMessage: false
    }
  }

  componentDidUpdate (prevProps) {
    if (
      (this.props.parametres.width !== prevProps.parametres.width) ||
      (this.props.parametres.height !== prevProps.parametres.height) ||
      (this.props.parametres.dys !== prevProps.parametres.dys)
    ) {
      this.setState({
        showReloadMessage: true
      })
    }
  }

  /**
   * Synchronise le contenu de l'éditeur graphique avec redux-form
   */
  updateStoreFromEditor () {
    // getParametres correspond au mtgApp.getResult()
    let parametres = this.props.getParametres()
    // console.log('retour de mtgApp.getResult()', parametres)
    if (!parametres) throw new Error('mathgraph ne remonte aucune info')
    let {fig, level, isExercice} = parametres
    if (!fig || typeof fig !== 'string') throw new Error('mathgraph ne renvoie pas la figure')
    if (!level || typeof level !== 'number' || !Number.isInteger(level) || level < 0) {
      console.error(new Error('level n’est pas un entier positif ou nul (on le fixe à 3)'))
      // en attendant que ce soit réglé on le fixe arbitrairement à 3
      level = 3
    }
    // on teste pas la propriété score inutilisée ici

    this.props.change('parametres[fig]', fig)
    this.props.change('parametres[level]', level)
    this.props.change('parametres[isExercice]', isExercice)
  }

  /**
  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
    // @todo vérifier que this.iframe.current existe et gérer l'erreur éventuelle
    const {parametres} = this.props
    iframe.current.contentWindow.load({parametres}, this.props.getLoadCb(this.updateStoreFromEditor.bind(this)))
  }

  render () {
    return (
      <Fragment>
        <fieldset>
          <div className="grid-3">
            <label>Largeur imposée <i>laisser vide pour s&apos;adapter à l&apos;écran de l&apos;utilisateur</i>
              <IntegerField
                name="parametres[width]"
                min="300"
              />
            </label>
            <label>Hauteur imposée <i>laisser vide pour s&apos;adapter à l&apos;écran de l&apos;utilisateur</i>
              <IntegerField
                name="parametres[height]"
                min="200"
              />
            </label>
            <label>
              Affichage adapté &laquo;dys&raquo;
              <Field
                name="parametres[dys]"
                component="input"
                type="checkbox"
                className="switch"
              />
            </label>
          </div>
          {this.state.showReloadMessage ? (
            <span className="alert--warning">
              Cette modification sera visible lors du prochain affichage de cette ressource.
            </span>
          ) : null}
        </fieldset>
        <hr />
        <fieldset>
          {this.props.parametres.fig === undefined ? (
            <span className="alert--info">Pour ajouter un repère, utiliser le bouton
            &laquo;Nouvelle figure&raquo;</span>
          ) : null}
          <span className="alert--info">Vous pouvez changer les outils disponibles via le bouton &laquo;options&raquo;</span>
          <IframeHandler
            onLoad={this.onIframeLoaded.bind(this)}
            src={iframeSrc}
          />
        </fieldset>
      </Fragment>
    )
  }
}

EditorMathGraph.propTypes = {
  change: PropTypes.func,
  parametres: PropTypes.object,
  getLoadCb: PropTypes.func,
  getParametres: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func
}

export default iframeHelper(formValues({parametres: 'parametres'})(EditorMathGraph))
