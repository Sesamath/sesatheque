import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Field, formValues} from 'redux-form'
import IframeHandler from './IframeHandler'
import iframeHelper from './iframeHelper'

/**
 * Url de la page contenant l'éditeur ecjs
 * @type {string}
 */
const iframeSrc = require('../../client/plugins/ecjs/edit.html')

// récupérer cette liste avec (sur le site ressources)
// ls -1 replication_calculatice/javascript/exercices/|sed -re "/complement|lang/d; s/(.*)/'\1',/"
const typesEcjs = [
  'addiclic',
  'approximationsomme',
  'araignee',
  'balance',
  'balanceadd',
  'basketmath',
  'basketmath2p',
  'basketmath3p',
  'bocal',
  'bouleetboule',
  'bouleetbouledecimaux',
  'calculakartC3_4',
  'calculakartCE1',
  'calculakartCP',
  'calculdiffere',
  'carre',
  'cartes',
  'cartesCE2',
  'cartesCM1',
  'cartesCM2',
  'chateaufort',
  'chocolat1',
  'chocolat2',
  'chutedenombres',
  'chutedenombresmulti',
  'cibles',
  'croupier',
  'decollage',
  'decoupage',
  'diviclic',
  'elephants',
  'estimation',
  'fleurs',
  'frise',
  'grenouille',
  'grue',
  'horloge',
  'jackpot',
  'lacaisse',
  'lebanquier',
  'lesbornes',
  'marathon',
  'marathonCE1',
  'mbrique',
  'memory',
  'mistral',
  'multiclic',
  'nombresympathique',
  'numbercrushdecimaux',
  'oiseauaddition',
  'oiseaumultiplication',
  'operationsatrous',
  'pacman',
  'planeteaddition',
  'pokeplus',
  'quadricalc',
  'quadricalcinv',
  'recette',
  'rectangle',
  'sommeenligne',
  'supermarche',
  'surfacebleue',
  'tableattaque',
  'tapis',
  'tapisdecarte',
  'ticketdecaisse',
  'toise',
  'train',
  'viaduc'
]

class EditorEcjs extends Component {
  /**
   * Synchronise le contenu de l'éditeur graphique avec redux-form
   * (appel du getParametres de l'éditeur puis props.change)
   */
  updateStoreFromEditor () {
    let parametresPending = this.props.getParametres()
    if (!parametresPending) {
      // @todo Ajouter un gestionnaire d'erreur avec feedback
      console.error(new Error('l’éditeur graphique ne remonte aucune info'))
      return
    }
    // avec ecjs c'est une Promise
    parametresPending.then((parametres) => {
      console.log('l’éditeur graphique ecjs renvoie les paramètres', parametres)
      this.props.change('parametres', parametres)
    }).catch((error) => {
      console.error(error)
    })
  }

  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe) {
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres
    // on appelle (en global dans l'iframe) load(ressource, cb) qui rappellera cb(getParametres)
    iframe.current.contentWindow.load({parametres}, this.props.onLoadCb(this.updateStoreFromEditor.bind(this)))
    // on stocke une ref sur l'iframe
    this.iframe = iframe
  }

  onFichierJsChange () {
    console.log('onFichierJsChange avec', this.props.parametres.fichierjs)
    if (this.iframe) this.onIframeLoaded(this.iframe)
  }

  render () {
    console.log('render avec', this.props.parametres.fichierjs)
    const editor = this.props.parametres.fichierjs ? (
      <fieldset>
        <IframeHandler
          allowManualEdition
          onLoad={this.onIframeLoaded.bind(this)}
          src={iframeSrc}
          updateStoreFromEditor={this.updateStoreFromEditor.bind(this)}
          setUpdateStoreFromEditor={this.props.setUpdateStoreFromEditor}
        />
      </fieldset>
    ) : null

    // et on retourne select + editor
    return (
      <Fragment>
        <label className="select">
          Type d’exercice
          <Field name="parametres[fichierjs]" component="select" onChange={this.onFichierJsChange.bind(this)}>
            <option value="">Choisir un type d’exercice</option>
            {typesEcjs.map(typeEcjs => (
              <Fragment key={typeEcjs}>
                <option value={typeEcjs}>{typeEcjs}</option>
              </Fragment>
            ))}
          </Field>
        </label>
        {editor}
      </Fragment>
    )
  }
}

EditorEcjs.propTypes = {
  // ces deux props sont fournies par ResourceForm
  change: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func,
  // ça c'est redux-form
  parametres: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  // iframeHelper ajoute ces deux props (la 2e est dans son state, mise par la première)
  onLoadCb: PropTypes.func,
  getParametres: PropTypes.func
}

export default iframeHelper(
  formValues({parametres: 'parametres'})(EditorEcjs)
)
