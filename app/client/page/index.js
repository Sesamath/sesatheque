/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'
// On ajoutait les @babel/polyfill via ce fichier et non directement dans les entries de webpack.
// C'était le seul moyen pour qu'il soit pris en compte par babel-env-preset 'useBuiltIns' option
// (qui filtrait pour n'inclure que les polyfills nécessaires pour les browsers ciblés.)
// depuis babel 7.4, y'a plus de @babel/polyfill,
// on utilise directement core-js qui s'occupe d'ajouter les polyfill nécessaires,
// cf https://www.thebasement.be/updating-to-babel-7.4/
// https://babeljs.io/blog/2019/03/19/7.4.0
// avec useBuiltIns: "usage" faut pas ces deux lignes (seulement avec entry)
require('core-js/stable')
require('regenerator-runtime/runtime')

const dom = require('sesajstools/dom')
const log = require('sesajstools/utils/log')
const sjtUrl = require('sesajstools/http/url')
const loadjs = require('loadjs')

const autosize = require('./autosize')
const refreshAuth = require('./refreshAuth')
const inBrowser = (typeof window) !== 'undefined'

// bugsnag s'ajoute tout seul à window, suffit de le charger
if (inBrowser) {
  require('../../client-react/utils/checkBrowser').default()
  require('./bugsnag')
}

const w = inBrowser ? window : {}
const wd = w.document

/**
 * En attendant la gestion du load async avec es6, on utilise loadjs,
 * on garde ici un mapping vers les modules tiers que l'on utilise
 */
const externalModules = {
  ckeditor: 'vendor/ckeditor/ckeditor.js',
  ckeditorJquery: 'vendor/ckeditor/adapters/jquery.js',
  swfobject: 'vendor/swfobject/swfobject.2.3.min.js'
}

let base = '/'

/**
 * Ajoute un texte d'erreur dans errorsContainer (#errors ou #error ou #warnings) ET dans console.error (si ça existe)
 * L'existence de cette fonction est testée par init.js pour savoir si on doit être chargé.
 * @param {string|Error} error Le message à afficher
 * @param {number} [delay] Un éventuel délai d'affichage en secondes
 */
export function addError (error, delay) {
  // on log toujours en console
  if (!error) return log.error(new Error('page.addError appelé sans erreur à afficher'))
  log.error(error)
  const errorsContainer = wd.getElementById('errors') || wd.getElementById('error') || wd.getElementById('warnings')
  let errorMsg = (error instanceof Error) ? error.toString() : error
  if (/^TypeError:/.test(errorMsg)) {
    // on envoie qqchose de plus compréhensible
    errorMsg = 'Une erreur est survenue (voir la console pour les détails)'
  }
  if (errorsContainer) {
    // on ajoute un peu de margin à ce div s'il n'en a pas
    if (errorsContainer.style && !errorsContainer.style.margin) errorsContainer.style.margin = '0.2em'
    const errorBlock = dom.addElement(errorsContainer, 'p', {class: 'error'}, errorMsg)
    // si on a jQuery sous la main on scroll, sinon tant pis
    if (window.jQuery) window.jQuery(errorsContainer).scrollTop(0)
    if (delay) {
      setTimeout(function () {
        errorsContainer.remove(errorBlock)
      }, delay * 1000)
    }
  } else {
    log.error(new Error("errorsContainer n’existe pas, impossible d'afficher une erreur dedans " + errorMsg))
  }
}

/**
 * Affiche le bouton vu, ajoute son comportement au clic et le retourne
 * @param {function} onClickCb sera appelée à chaque clic sur le bouton
 * @return {Element} undefined si #boutonVu n'existait pas dans la page
 */
export function addBoutonVu (onClickCb) {
  try {
    const boutonVu = wd.getElementById('boutonVu')
    if (boutonVu) {
      boutonVu.addEventListener('click', onClickCb)
      dom.setStyles(boutonVu, {display: 'block'})
    }
    return boutonVu
  } catch (e) {
    /* tant pis */
  }
}

/**
 * Cache le #titre (en global pour que les plugins puissent le faire)
 */
export function hideTitle () {
  try {
    const titre = wd.getElementById('titre')
    if (titre && titre.style) titre.style.display = 'none'
    log(titre ? 'titre masqué' : 'demande de masquage mais titre non trouvé')
    const picto = wd.getElementById('pictoFeedback')
    if (picto && picto.style) picto.style.display = 'none'
    log(picto ? 'picto feedback masqué' : 'demande de masquage mais picto feedback non trouvé')
  } catch (e) {
    /* tant pis */
  }
}

/**
 * Complète les options si besoin avec base, container, errorsContainer qui seront créés si besoin,
 * et ajoute aux options 'urlResultatCallback', 'userOrigine', 'userId' si elles n'y sont pas et sont dans l'url
 * @param {initOptions}   options
 * @param {errorCallback} [next]
 */
export function init (options, next) {
  if (!options) options = {}
  if (options.base) setBase(options.base)
  else options.base = base
  // (des)active la fct de log si on le demande, l'url est prioritaire sur options
  let verbose = sjtUrl.getParameter('verbose') || options.verbose
  if (verbose === '0' || verbose === 'false') verbose = false
  if (verbose) log.enable()
  else log.disable()

  // on vérifie que l'on a nos containers et on les créé sinon
  /**
   * Le conteneur html pour afficher la ressource, passé en options ou pris dans le dom si #display
   * @type {Element}
   */
  let container = options.container || wd.getElementById('display')
  /**
   * Le conteneur html pour afficher d'éventuelles erreurs, passé en options ou pris dans le dom si #errors
   * @type {Element}
   */
  let errorsContainer = options.errorsContainer || wd.getElementById('errors')
  if (!errorsContainer) errorsContainer = dom.addElement(wd.getElementsByTagName('body')[0], 'div', {id: 'errors'})
  if (!container) container = dom.addElement(wd.getElementsByTagName('body')[0], 'div', {id: 'display'})
  // et on ajoute ces deux éléments aux options
  options.container = container
  options.errorsContainer = errorsContainer

  // on regarde si d'autres options ont été passé en GET
  let paramGet
  ;['resultatMessageAction', 'urlResultatCallback', 'userOrigine', 'userId'].forEach(function (param) {
    paramGet = sjtUrl.getParameter(param)
    if (!options[param] && paramGet) options[param] = paramGet
  })
  paramGet = sjtUrl.getParameter('showTitle')
  if (paramGet === '0' || paramGet === 'false') options.showTitle = false

  // terminé
  if (next) next()
}

/**
 * Pour charger des modules référencé ici en async, avec loadjs
 * @param {Array} moduleNames
 * @param {boolean} [parallelLoad=true]
 * @param callback
 */
export function loadAsync (moduleNames, parallelLoad, callback) {
  if (callback === undefined) {
    callback = parallelLoad
    parallelLoad = true
  }
  // on accepte les string
  if (typeof moduleNames === 'string') moduleNames = [moduleNames]

  // on passe par loadjs qui gèrera au passage l'unicité de l'appel
  const paths = []
  const errors = []
  moduleNames.forEach(function (moduleName) {
    let path = externalModules[moduleName]
    // si moduleName est un externalModule connu on le prend
    if (path) path = base + path
    // sinon moduleName doit être une url absolue (http… ou //domain/path)
    else if (/^(https?:)?\/\//.test(moduleName)) path = moduleName
    if (path) paths.push(path)
    else errors.push(moduleName)
  })
  if (errors.length) {
    addError('Impossible de charger le ou les modules inconnus suivants ' + errors.join(', '))
  } else if (paths.length) {
    const {body} = wd
    const waitingElt = dom.addElement(body, 'div', {className: 'waiting'}, 'chargement en cours…')
    loadjs(paths, {
      async: parallelLoad,
      success: () => {
        body.removeChild(waitingElt)
        callback()
      },
      error: (modules) => {
        body.removeChild(waitingElt)
        addError('Impossible de charger le ou les modules suivants ' + modules.join(', '))
      }
    })
  } else {
    callback()
  }
}

/**
 * Change la base (pour la mettre absolue après chargement de ce module en cross domain)
 * @param newBase
 */
export function setBase (newBase) {
  if (newBase.substring(-1) !== '/') newBase += '/'
  base = newBase
}

/**
 * Affiche une notification
 * @param {string} htmlString
 * @param {number} [delay=5] délai en s avant fermeture auto
 */
export function showNotification (htmlString, delay = 5) {
  const parent = document.body
  const style = {
    position: 'absolute',
    top: '80px',
    left: '80px',
    padding: '1em',
    'max-width': '50%',
    'max-height': '50%',
    overflow: 'auto',
    'background-color': '#fff',
    border: 'solid #333'
  }
  const notif = dom.addElement(parent, 'div', {style})
  notif.innerHTML = htmlString
  const closerElt = dom.addElement(notif, 'img', {src: '/medias/cocheVerte.png', alt: '', style: {position: 'absolute', top: '5px', right: '5px'}})
  const closeNotif = () => {
    if (isClosed) return
    isClosed = true
    closerElt.removeEventListener('click', closeNotif)
    parent.removeChild(notif)
  }
  let isClosed = false
  closerElt.addEventListener('click', closeNotif)
  setTimeout(closeNotif, delay * 1000)
}

/**
 * Module de base pour les méthodes spécifiques à sesatheque et son dom (addError, hideTitle)
 * @service page
 */
export default {
  addError,
  addBoutonVu,
  autosize,
  hideTitle,
  init,
  loadAsync,
  refreshAuth,
  setBase,
  showNotification
}

/* et l'on s'exporte dans le dom global pour pouvoir être utilisé hors webpack
if (typeof window !== 'undefined') {
  if (typeof window.sesatheque === 'undefined') window.sesatheque = {}
  window.sesatheque.page = module.exports
} /**/

/**
 * Options à passer à init() ou à display(), les autres propriétés seront laissées intactes
 * @typedef initOptions
 * @type {Object}
 * @property {string}  [base=/]          Le préfixe de chemin vers la racine de la sésathèque.
 *                                         Il faut passer un chemin http://… complet si ce module est utilisé sur un autre domaine que la sésathèque
 * @property {Element} [container]       L'élément html qui servira de conteneur au plugin pour afficher sa ressource, créé si non fourni
 * @property {boolean} [showTitle=true]  Passer false pour ne pas afficher le titre
 * @property {Element} [errorsContainer] L'élément html pour afficher des erreurs éventuelles, créé si non fourni
 * @property {boolean} [verbose=false]   Passer true pour ajouter des log en console
 */

/**
 * Un élément du Dom HTML
 * @typedef Element
 * @type {Object}
 * @see https://developer.mozilla.org/fr/docs/Web/API/Element
 */
