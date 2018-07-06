import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Field, formValues} from 'redux-form'
import IframeHandler from './IframeHandler'
import iframeHelper from '../hoc/iframeHelper'
// page de l'éditeur ecjs à insérer en iframe
import iframeSrc from '../../client/plugins/ecjs/edit.html'

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
    // on stocke une ref sur l'iframe
    this.iframe = iframe
    this.loadResourceInEditor()
  }

  loadResourceInEditor () {
    if (!this.iframe) {
      console.error(Error(`Impossible de charger une ressource avant d'avoir chargé l'iframe`))
      return
    }
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres
    // on appelle (en global dans l'iframe) load(ressource, cb) qui rappellera cb(getParametres)
    this.iframe.current.contentWindow.load({parametres}, this.props.getLoadCb(this.updateStoreFromEditor.bind(this)))
  }

  /**
   * Retourne true s'il faut refaire un rendu (si fichierjs a changé)
   * @see https://reactjs.org/docs/react-component.html#shouldcomponentupdate
   * @param {object} nextProps
   * @return {boolean}
   */
  shouldComponentUpdate (nextProps) {
    return nextProps.parametres.fichierjs !== this.props.parametres.fichierjs
    // Normalement le seul cas où il faut relancer un render, c'est si y'avait pas de fichierjs
    // et qu'il va y en avoir un (le contraire devrait pas être possible mais renverrait true aussi)
    // donc avec la condition ci-dessous
    // return Boolean(nextProps.parametres.fichiersjs) !== Boolean(this.props.parametres.fichiersjs)

    // car si fichierjs change d'une valeur à une autre c'est inutile de refaire un rendu de la même chose
    // mais il faudrait appeler le load ici (et pas dans componentDidUpdate qui ne serait alors pas appelé) alors que les props n'ont pas encore été mise à jour
    // on préfère gaspiller qq rendus pour appeler le load de l'iframe dans componentDidUpdate avec les props à jour
  }

  /**
   * Appelé après une modif des props ou du state (après render s'il y en a eu un, mais pas après le 1er render)
   * Rappelle la méthode load dans l'iframe si fichierjs a changé
   * @see https://reactjs.org/docs/react-component.html#componentdidupdate
   * @param prevProps
   */
  componentDidUpdate (prevProps) {
    if (prevProps.parametres.fichierjs !== this.props.parametres.fichierjs) {
      this.loadResourceInEditor()
    }
  }

  render () {
    // et on retourne select + editor
    let i = 0
    return (
      <Fragment>
        <label className="select">
          Type d’exercice
          <Field name="parametres[fichierjs]" component="select">
            <option key={i++} value="">Choisir un type d’exercice</option>
            {typesEcjs.map(typeEcjs => (<option key={i++} value={typeEcjs}>{typeEcjs}</option>))}
          </Field>
        </label>
        {this.props.parametres.fichierjs ? (
          <fieldset>
            <IframeHandler
              allowManualEdition
              onLoad={this.onIframeLoaded.bind(this)}
              src={iframeSrc}
              updateStoreFromEditor={this.updateStoreFromEditor.bind(this)}
              setUpdateStoreFromEditor={this.props.setUpdateStoreFromEditor}
            />
          </fieldset>
        ) : null}
      </Fragment>
    )
  }
}

EditorEcjs.propTypes = {
  // ces deux props sont fournies par resourceSaver
  change: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func,
  // ça c'est redux-form
  parametres: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  // iframeHelper ajoute ces deux props (la 2e est dans son state, affectée par loadCb)
  getLoadCb: PropTypes.func,
  getParametres: PropTypes.func
}

export default iframeHelper(
  formValues({parametres: 'parametres'})(EditorEcjs)
)
