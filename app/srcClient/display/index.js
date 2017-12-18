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

/**
 * Afficheur générique pour l'affichage de toutes les ressources
 * appelé avant les plugins (c'est sa fct load qui chargera le bon)
 *
 * Son chargement déclenche celui de init qui ajoute en global nos méthodes utilitaires, cf {@link namespace:sesamath}
 */
'use strict'

const dom = require('sesajstools/dom')
const log = require('sesajstools/utils/log')
const sjt = require('sesajstools')
const sjtUrl = require('sesajstools/http/url')
const sesatheques = require('sesatheque-client/src/sesatheques')
const xhr = require('sesajstools/http/xhr')

const page = require('../page')
const consoleErrorSpy = require('../page/consoleErrorSpy')
const errorCatcher = require('../page/errorCatcher')
const xhrPostSync = require('../page/xhrPostSync')
const Resultat = require('../../constructors/Resultat')

const wd = window.document

/**
 * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
 * @private
 * @type {number}
 */
const ajaxTimeout = 10000

const debugMode = sjtUrl.getParameter('debug')

/**
 * Ajoute une méthode resultatCallback aux options si besoin
 * @private
 * @param {Object}   options        L'objet sur lequel on ajoutera la methode resultatCallback
 */
function addResultatCallback (ressource, options) {
  // appelle resultatListener avec le résultat formaté (ou rapporte une erreur)
  function processResult (result, resultatListener) {
    if (result && result instanceof Error) {
      log.error(result)
      feedback({success: false, error: result.toString()}, divFeedback)
    } else if (result) {
      const resultat = getResultat(result, ressource, options)
      if (isDebugMode) console.log('resultatCallback va envoyer', resultat)
      resultatListener(resultat)
    } else {
      const error = new Error('callback de résultat appelée sans erreur ni résultat')
      if (window.bugsnagClient) window.bugsnagClient(error)
      log.error(error)
    }
  }
  const divFeedback = wd.getElementById('pictoFeedback')
  const isDebugMode = ['all', 'resultat'].includes(debugMode)
  let resultatListener

  // pour envoyer les résultats, on regarde si on nous fourni une url ou une fct ou un nom de message
  // on prend en callback par ordre de priorité resultatCallback, urlResultatCallback, resultatMessageAction+
  if (options.resultatCallback && sjt.isFunction(options.resultatCallback)) {
    resultatListener = options.resultatCallback
  } else if (options.urlResultatCallback && sjt.isUrlAbsolute(options.urlResultatCallback)) {
    // callback ajax
    resultatListener = (resultat) => {
      const url = options.urlResultatCallback
      if (resultat.deferSync) {
        delete resultat.deferSync
        xhrPostSync(url, resultat, alertIfError)
      } else {
        xhr.post(url, resultat, {timeout: ajaxTimeout}, (error, retour) => {
          if (!retour) retour = {}
          if (error) {
            console.error(error)
            if (!retour.error) retour.error = error.toString()
          }
          feedback(retour, divFeedback)
        })
      }
    }
  } else if (options && options.resultatMessageAction && sjt.isString(options.resultatMessageAction)) {
    // callback message
    resultatListener = (resultat) => sendMessage(options, resultat)
  } else if (isDebugMode) {
    log('activation de la récup du résultat en console pour débug')
    resultatListener = (resultat) => console.log('[DEBUG] resultat qui aurait été envoyé', resultat)
  }

  // on wrap si qqun écoute
  if (resultatListener) {
    options.resultatCallback = (result) => processResult(result, resultatListener)
  }
} // addResultatCallback

/**
 * Callback pour l'envoi au unload
 * @param {Error} error
 */
function alertIfError (error) {
  if (!error) return
  console.error(error)
  /* global bugsnagClient, alert */
  if (typeof bugsnagClient !== 'undefined') bugsnagClient.notify(error)
  alert(error)
}

/**
 * Gère l'affichage du feedback puis appelle next(retour)
 * @private
 * @type feedbackCallback
 * @param {retour} retour Le retour de l'envoi du résultat
 * @param {HTMLElement} divFeedback
 */
function feedback (retour, divFeedback) {
  log('feedback', retour)
  if (retour && retour.error) {
    feedbackKo(divFeedback)
    page.addError(retour.error)
  } else if ((retour && (retour.ok && retour.ok === true)) || (retour.success && retour.success === true)) {
    feedbackOk(divFeedback)
  } else if (retour && (retour.hasOwnProperty('ok') || retour.hasOwnProperty('success'))) {
    feedbackKo(divFeedback)
    page.addError("Une erreur est survenue dans l'enregistrement du résultat")
  } else {
    // else on en sait rien on fait rien
    log.error(new Error('feedback appellé sans argument intelligible'), retour)
  }
}
// Éteint le feedback */
function feedbackOff (divFeedback) {
  divFeedback.className = 'feedbackOff'
}
// Allume le feedback OK pour 4s
function feedbackOk (divFeedback) {
  divFeedback.className = 'feedbackOk'
  setTimeout(feedbackOff, 4000)
}
// Allume le feedback KO pour 4s
function feedbackKo (divFeedback) {
  divFeedback.className = 'feedbackKo'
  setTimeout(feedbackOff, 4000)
}

/**
 * Retourne l'objet Resultat (ou affiche une erreur en feedback si result en est une)
 * @private
 * @param result
 * @return {Resultat|undefined}
 */
function getResultat (result, ressource, options) {
  const resultat = new Resultat(result)
  // pour l'envoi au unload on ajoute ça
  if (options.urlResultatCallback && result.deferSync) resultat.deferSync = result.deferSync
  // on impose date et durée
  resultat.date = new Date()
  // le plugin peut imposer sa mesure, on ne met la durée que s'il ne l'a pas fourni
  if (!resultat.duree && options.startDate) {
    resultat.duree = Math.floor(((new Date()).getTime() - options.startDate.getTime()) / 1000)
  }
  // on impose ça d'après la ressource
  resultat.ressType = ressource.type
  resultat.rid = ressource.rid
  // on regarde si on nous a demandé d'ajouter des propriétés au résultat (via querystring ou options)
  ;['sesatheque', 'userOrigine', 'userId'].forEach(function (paramName) {
    const paramValue = sjtUrl.getParameter(paramName) || options[paramName]
    if (paramValue) resultat[paramName] = paramValue
  })
  return resultat
}

/**
 * Fait le chargement proprement dit après page.init
 * @private
 * @param ressource
 * @param options
 * @param next
 */
function load (ressource, options, next) {
  log('display avec la ressource', ressource)
  log('et les options après page.init', options)

  // le display du plugin
  const pluginName = ressource.type
  const pluginDisplay = require('../plugins/' + pluginName + '/display')
  if (!pluginDisplay) throw new Error("L'affichage des ressources de type ' + pluginName + ' n'est pas encore implémenté")

  try {
    if (options.container) dom.empty(options.container)
    else throw new Error("L'initialisation a échoué, pas de conteneur pour la ressource")
    if (!options.errorsContainer) throw new Error("L'initialisation a échoué, pas de conteneur pour afficher les erreurs")
    // On vire le titre si on nous le demande via les options ou un param dans l'url
    if (
      (options.hasOwnProperty('showTitle') && !options.showTitle) ||
      /\?.*showTitle=0/.test(wd.URL) ||
      /\/apercevoir\//.test(wd.URL) ||
      /\?(.+&)?layout=iframe/.test(wd.URL)
    ) {
      page.hideTitle()
    }

    // on regarde s'il faut ajouter une fct de sauvegarde des résultats
    addResultatCallback(ressource, options)

    // ajout du chemin du plugin aux options
    options.pluginBase = options.base + 'plugins/' + pluginName + '/'

    // on peut afficher
    pluginDisplay(ressource, options, function (error) {
      options.startDate = new Date()
      if (error) {
        log("le display a terminé mais renvoyé l'erreur", error)
        page.addError(error)
      } else {
        log('le display a terminé sans renvoyer d’erreur')
      }
      if (next) next(error)
    })
  } catch (err) {
    page.addError(err.toString())
  }
} // load

/**
 * Log en console.error si error
 * @param {Error} error
 */
function logIfError (error) {
  if (error) console.error(error)
}

/**
 * Envoie le résultat au dom parent (à priori sesalab) avec un postMessage mais ne gère pas de feedback
 * (faudrait passer dans le message une action de retour et un id, et ajouter un écouteur dessus)
 * c'est le parent qui affichera le feedback
 */
function sendMessage (options, resultat) {
  const chunks = options.resultatMessageAction.split('::')
  const action = options.resultatMessageAction
  // le nom de la propriété attendue par celui qui écoute
  const resultatProp = chunks[1] || 'resultat'
  const message = {
    action: action
  }
  message[resultatProp] = resultat
  // on envoie
  window.top.postMessage(message, '*')
}

/**
 * Module d'une seule fonction pour afficher une ressource quelconque.
 * Il chargera le bon afficheur en lui passant les options attendues,
 * en créant si besoin les contereurs dans le dom courant, avec un appel de page.init(options).
 * Il créera aussi éventuellement un wrapper pour appeler une callback de résultat éventuelle
 * @service display
 * @param {Ressource}     ressource La ressource à afficher
 * @param {initOptions}   [options] Les options éventuelles (passer base si ce js est chargé sur un autre domaine)
 * @param {errorCallback} [next]    Fct appelée à la fin du chargement avec une erreur ou undefined
 */
module.exports = function display (ressource, options, next) {
  /**
   * Envoie une erreur à /api/notifyError (ajoute le rid de la ressource courante)
   * @param {string|object} infos
   */
  function notifyError (infos) {
    const type = typeof infos
    if (type === 'string') infos = {error: infos}
    else if (typeof infos !== 'object') return console.error(new Error(`paramètre invalide dans notifyError (type ${type}, il faut string ou object)`))
    infos.rid = ressource.rid
    // et on envoie
    xhr.post('/api/notifyError', infos, logIfError)
  }

  if (typeof next !== 'function') {
    next = (error) => {
      if (error) page.addError(error)
    }
  }

  try {
    // init params
    if (typeof options === 'function') {
      next = options
      options = {}
    } else {
      if (typeof next !== 'function') {
        if (next) console.error(new Error('paramètre next invalide'), next)
        next = logIfError
      }
      if (!options || typeof options !== 'object') {
        if (options) console.error(new Error('options invalides'), options)
        options = {}
      }
    }

    // activation du log en debug
    if (['all', 'display'].includes(debugMode)) log.enable()
    // log('options avant page.init', options)

    // on accepte des baseId dans options.base
    if (typeof options.base === 'string' && options.base.substr(0, 4) !== 'http') {
      try {
        options.base = sesatheques.getBaseUrl(options.base)
      } catch (error) {
        return next(error)
      }
    }
    // on ajoute notifyError à options
    options.notifyError = notifyError

    // on veut récupérer les erreurs de la console pour les envoyer dans le log au unload
    consoleErrorSpy.start()
    // idem pour les autres erreurs
    errorCatcher.start()
    // et pour les envoyer au unload si y'en a
    const unloadListener = () => {
      // à priori si on est au unload window va être détruit et c'est inutile de faire ça
      // mais au cas où on a envoyé un alert, pas la peine de boucler…
      // (ou si un navigateur ne détruisait pas les listener au changement d'url d'une iframe par ex)
      window.removeEventListener('unload', unloadListener)
      // c'est quand même pénible, il reste plein de trucs vides…
      // (alors que les error devraient toutes avoir été remplacées par leur stack)
      const errors = consoleErrorSpy.stop().concat(errorCatcher.stop()).filter(e => {
        const j = sjt.stringify(e)
        if (j === '{}' || j === '{"isTrusted":true}') return false
      })
      if (!errors.length) return
      const data = {
        rid: ressource.rid,
        type: ressource.type,
        error: 'Erreurs du display',
        // les Error ont déjà été remplacées par leur stack (pour éviter de se faire dégager
        // par le stringify du post en JSON)
        errors
      }
      xhrPostSync('/api/notifyError', data, alertIfError)
    }
    window.addEventListener('unload', unloadListener)

    // ajout de metadata pour bugsnag
    if (window.bugsnagClient) {
      window.bugsnagClient.metaData.rid = ressource.rid
      window.bugsnagClient.metaData.type = ressource.type
    }

    // on peut lancer l'init
    page.init(options, function (error) {
      if (error) return next(error)
      load(ressource, options, next)
    })
  } catch (error) {
    next(error)
  }
}

/* et l'on s'exporte dans le dom global pour pouvoir être utilisé hors webpack
if (typeof window !== 'undefined') {
  if (typeof window.sesatheque === 'undefined') window.sesatheque = {}
  window.sesatheque.display = display
} /**/

/**
 * Options à passer à display (celles de initOptions plus d'autres)
 * display ajoutera une propriété pluginBase pour appeler les méthodes display des plugins
 * @typedef displayOptions
 * @type {Object}
 * @property {string}           [base=/]                Le préfixe de chemin vers la racine de la sésathèque.
 *                                                        Si ce module est utilisé sur un autre domaine que la sésathèque
 *                                                        il faut passer une baseId connue de sesatheque-client
 *                                                        ou un chemin http://… complet
 *
 * @property {Element}          [container]             L'élément html qui servira de conteneur au plugin pour afficher sa ressource, créé si non fourni
 * @property {Element}          [errorsContainer]       L'élément html pour afficher des erreurs éventuelles, créé si non fourni
 * @property {boolean}          [verbose=false]         Passer true pour ajouter des log en console
 * @property {boolean}          [isDev=false]           Passer true pour initialiser le dom source en devsesamath (pour certains plugins)
 * @property {string}           [urlResultatCallback]   Une url vers laquelle poster le résultat
 *                                                        (idem si la page de la ressource contient ?urlScoreCallback=http…)
 * @property {string}           [resultatMessageAction] Un nom d'action pour passer le résultat en postMessage
 * @property {resultatCallback} [resultatCallback]      Une fonction pour recevoir un objet Resultat (si y'a pas de urlScoreCallback)
 * @property {string}           [sesatheque]            Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page),
 *                                                        le nom de la sésathèque pour un client qui récupère des résultats de plusieurs sésatheques
 * @property {boolean}          [showTitle=true]        Passer '0' ou 'false' via l'url ou false via options pour cacher le titre
 * @property {string}           [userOrigine]           Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page)
 * @property {string}           [userId]                Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page)
 * @property {object}           [flashvars]             Pour les plugins qui chargent du swf, sera passé en flashvars en plus
 * @property {Resultat}         [lastResultat]          Un éventuel Resultat
 */

/**
 * @callback resultatCallback
 * @param {Resultat} Un objet Resultat (en cas d'erreur la callback n'est pas appelée)
 * @param {feedbackCallback}
 */

/**
 * @callback feedbackCallback
 * @param {feedbackArg} retour Le retour de resultatCallback (pour confirmer une sauvegarde)
 */

/**
 * @typedef feedbackArg
 * @type {object}
 * @param {boolean} success
 * @param {string}  [error]
 */
