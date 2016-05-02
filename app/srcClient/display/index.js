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

// @todo mettre les conteneurs (titre et feedback) et les fcts qui les utilisent dans la fct init pour être local à l'invocation mais pas au module

var dom = require('sesajstools/dom')
var log = require('sesajstools/utils/log')
var tools = require('sesajstools')

var page = require('../page/index')
var Resultat = require('../../constructors/Resultat')

var wd = window.document

/**
 * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
 * @private
 * @type {number}
 */
var ajaxTimeout = 10000
/**
 * La date de début d'affichage
 */
var startDate

/**
 * Fait le chargement proprement dit après page.init
 * @private
 * @param {Error} [error] Une erreur éventuelle à l'init
 */
function load (ressource, options, next) {
  log('display avec la ressource', ressource)
  log('et les options après page.init', options)

  // ajoute de la css commune à toutes les ressources ici
  dom.addCss(options.base + 'styles/ressourceDisplay.css')

  // le display du plugin
  var pluginName = ressource.type
  var pluginDisplay = require('../plugins/' + pluginName + '/display')
  if (!pluginDisplay) throw new Error("L'affichage des ressources de type ' + pluginName + ' n'est pas encore implémenté")

  try {
    log('plugin ' + pluginName + ' chargé')
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
    addResultatCallback(options)

    options.pluginBase = options.base + 'plugins/' + pluginName + '/'
    // on peut afficher
    pluginDisplay(ressource, options, function (error) {
      startDate = new Date()
      if (error) {
        log("le display a terminé mais renvoyé l'erreur", error)
        page.addError(error)
      } else {
        log('le display a terminé sans erreur')
      }
      if (next) next(error)
    })
  } catch (err) {
    page.addError(err.toString())
  }
} // load

/**
 * Ajoute une méthode resultatCallback aux options si besoin
 * @private
 * @param {Object}   options        L'objet sur lequel on ajoutera la methode resultatCallback
 */
function addResultatCallback (options) {
  // de toute façon on s'intercale pour formater le résultat
  function formatResult (result, next) {
    if (result && result instanceof Error) {
      log.error(result)
      feedback({success: false, error: result.toString()})
    } else if (result) {
      var deferSync = result.deferSync
      var resultat = new Resultat(result)
      // pour l'ajax on ajoute ça
      if (options.urlResultatCallback && deferSync) resultat.deferSync = deferSync
      // on impose date et durée
      resultat.date = new Date()
      // le plugin peut imposer sa mesure
      if (!resultat.duree && startDate) {
        resultat.duree = Math.floor(((new Date()).getTime() - startDate.getTime()) / 1000)
      }
      // on regarde si on nous a demandé d'ajouter des paramètres utilisateur au résultat
      [ 'sesatheque', 'userOrigine', 'userId' ].forEach(function (paramName) {
        var paramValue = tools.getURLParameter(paramName) || options[ paramName ]
        if (paramValue) resultat[ paramName ] = paramValue
      })
      log('display envoie à la callback de résultat', resultat)
      next(resultat, feedback)
    } else {
      log.error(new Error('callback de résultat appelée sans erreur ni résultat'))
    }
  }

  // pour envoyer les résultats, on regarde si on nous fourni une url ou une fct ou un nom de message
  // on prend en callback par ordre de priorité resultatCallback, urlResultatCallback, resultatMessageAction+
  if (options.resultatCallback && tools.isFunction(options.resultatCallback)) {
    // fct de callback
    var next = options.resultatCallback
    options.resultatCallback = function resultatCallbackWrapper (result) {
      formatResult(result, next)
    }
  } else if (options.urlResultatCallback && tools.isUrlAbsolute(options.urlResultatCallback)) {
    // callback ajax
    options.resultatCallback = function resultatCallbackWrapper (result) {
      var deferSync = !!result.deferSync
      formatResult(result, function (resultat, next) {
        sendAjax(options.urlResultatCallback, resultat, deferSync, next)
      })
    }
  } else if (options && options.resultatMessageAction && tools.isString(options.resultatMessageAction)) {
    // callback message
    options.resultatCallback = function resultatCallbackWrapper (result) {
      formatResult(result, function (resultat) {
        sendMessage(options, resultat)
      })
    }
  }
} // addResultatCallback

/**
 * poste le resultat en ajax vers url puis appellera next avec (error, retour)
 * @private
 * @param {string}   url
 * @param {Resultat} resultat
 * @param {boolean}  [deferSync] Passer true pour envoyer le résultat en synchrone sur le domaine courant
 *                                 (une sesatheque sinon ça marchera pas)
 *                                 qui fera suivre (pour éviter les pbs de CORS)
 *                                 à n'utiliser que quand on ne peut pas faire autrement (sur un événement unload par ex)
 * @param {feedbackCallback} next
 */
function sendAjax (url, resultat, deferSync, next) {
  var xhr = require('sesajstools/http/xhr')
  if (!next && typeof deferSync === 'function') next = deferSync
  var xhrOptions = {
    timeout: ajaxTimeout
  }
  if (deferSync === true) {
    resultat.deferUrl = url
    url = '/api/deferPost'
    xhrOptions.sync = true // xhrOptions.timeout sera ignoré
    log('on passe en synchrone vers ' + url)
  }
  xhr.post(url, resultat, xhrOptions, next)
}

/**
 * Envoie le résultat au dom parent (à priori sesalab) avec un postMessage mais ne gère pas de feedback
 * (faudrait passer dans le message une action de retour et un id, et ajouter un écouteur dessus)
 * c'est le parent qui affichera le feedback
 */
function sendMessage (options, resultat) {
  var chunks = options.resultatMessageAction.split('::')
  var action = options.resultatMessageAction
  // le nom de la propriété attendue par celui qui écoute
  var resultatProp = chunks[1] || 'resultat'
  var message = {
    action: action
  }
  message[resultatProp] = resultat
  // on envoie
  window.top.postMessage(message, '*')
}

// Éteint le feedback */
function feedbackOff () {
  if (divFeedback) divFeedback.className = 'feedbackOff'
}

// Allume le feedback OK pour 4s
function feedbackOk () {
  if (divFeedback) {
    divFeedback.className = 'feedbackOk'
    setTimeout(feedbackOff, 4000)
  }
}

// Allume le feedback KO pour 4s
function feedbackKo () {
  if (divFeedback) {
    divFeedback.className = 'feedbackKo'
    setTimeout(feedbackOff, 4000)
  }
}

/**
 * Gère l'affichage du feedback puis appelle next(retour)
 * @private
 * @type feedbackCallback
 * @param {feedbackArg} retour Le retour de l'envoi du résultat
 */
function feedback (retour) {
  log('feedback', retour)
  if (retour && retour.error) {
    feedbackKo()
    page.addError(retour.error)
  } else if (retour && (retour.ok && retour.ok === true) || (retour.success && retour.success === true)) {
    feedbackOk()
  } else if (retour && (retour.hasOwnProperty('ok') || retour.hasOwnProperty('success'))) {
    feedbackKo()
    page.addError("Une erreur est survenue dans l'enregistrement du résultat")
  } else {
    // else on en sait rien on fait rien
    log.error(new Error('feedback appellé sans argument intelligible'), retour)
  }
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
function display (ressource, options, next) {
  // console.log('options avant page.init', options)
  page.init(options, function (error) {
    if (error) {
      next(error)
    } else {
      divFeedback = wd.getElementById('pictoFeedback')
      load(ressource, options, next)
    }
  })
}

// Le conteneur du picto enregistrement
var divFeedback

module.exports = display

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
 *                                                        Il faut passer un chemin http://… complet si ce module est utilisé
 *                                                        sur un autre domaine que la sésathèque
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
