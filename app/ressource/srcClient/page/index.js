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

"use strict"
// l'écriture suivante fonctionne aussi, mais sans avoir l'autocomplétion dans l'IDE :-/
var tools = require('../tools')
var dom = require('../tools/dom')
var log = require('../tools/log')
var wd = window.document

/**
 * En attendant la gestion du load async avec es6, on utilise le bon vieux head.js,
 * on garde ici un mapping vers les modules tiers que l'on utilise
 */
var externalModules = {
  ckeditor: '/vendors/ckeditor/ckeditor',
  ckeditorJquery : '/vendors/ckeditor/adapters/jquery',
  jquery: '/vendors/jquery/jquery-1.11.3.min',
  jquery18: '/vendors/jquery/jquery-1.8.3.min',
  jqueryUi: '/vendors/jqueryUi/1.11.1/jquery-ui.min',
  jqueryUiDialog: '/vendors/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min',
  jsoneditor : '/vendors/jsoneditor/dist/jsoneditor.min',
  jstree: '/vendors/jstree/dist/jstree.min',
  lodash: '/vendors/lodash/lodash.min',
  mathjax: '/vendors/mathjax/2.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML&amp;delayStartupUntil=configured&amp;dummy',
  mathquill: '/vendors/mathquill-0.9.4/mathquill.min',
  pluginDetect : '/vendors/pluginDetect/javaFlashDetect.min.js',
  swfobject: '/vendors/swfobject/swfobject.2.3'
}

var base = '/'

/**
 * Ajoute un texte d'erreur dans errorsContainer (#errors ou #error ou #warnings) ET dans console.error (si ça existe)
 * L'existence de cette fonction est testée par init.js pour savoir si on doit être chargé.
 * @param {string|Error} error Le message à afficher
 * @param {number} [delay] Un éventuel délai d'affichage en secondes
 */
function addError(error, delay) {
  // on log toujours en console
  log.error(error)
  var errorsContainer = wd.getElementById('errors') || wd.getElementById('error') || wd.getElementById('warnings')
  var errorMsg = (error instanceof Error) ? error.toString() : error
  if (/^TypeError:/.test(errorMsg)) {
    // on envoie qqchose de plus compréhensible
    errorMsg = "Une erreur est survenue (voir la console pour les détails)"
  }
  if (errorsContainer) {
    // on ajoute un peu de margin à ce div s'il n'en a pas
    if (errorsContainer.style && !errorsContainer.style.margin) errorsContainer.style.margin = "0.2em"
    var errorBlock = dom.addElement(errorsContainer, 'p', {"class": "error"}, errorMsg)
    if (delay) {
      setTimeout(function () {
        errorsContainer.remove(errorBlock)
      }, delay * 1000)
    }
  } else {
    log.error(new Error("errorsContainer n'existe pas, impossible d'afficher une erreur dedans " + errorMsg))
  }
}

/**
 * Cache le #titre (en global pour que les plugins puissent le faire)
 */
function hideTitle() {
  try {
    var titre = wd.getElementById('titre')
    if (titre && titre.style) titre.style.display = "none"
    log(titre ? "titre masqué" : "demande de masquage mais titre non trouvé")
    var picto = wd.getElementById('pictoFeedback')
    if (picto && picto.style) picto.style.display = "none"
    log(picto ? "picto feedback masqué" : "demande de masquage mais picto feedback non trouvé")
  } catch (e) {
    /* tant pis */
  }
}

/**
 * Complète les options si besoin avec base, container, errorsContainer qui seront créés si besoin,
 * et ajoute aux options "urlResultatCallback", "userOrigine", "userId" si elles n'y sont pas et sont dans l'url
 * @param {initOptions}   options
 * @param {errorCallback} next
 */
function init(options, next) {
  if (!options) options = {}
  log('page.init avec les options', options)
  if (!options.base) options.base = base
  // (des)active la fct de log si on le demande, l'url est prioritaire sur options
  var verbose = tools.getURLParameter("verbose") || options.verbose
  if (verbose === "0" || verbose === "false") verbose = false
  if (verbose) log.enable()
  else log.disable()

  // on vérifie que l'on a nos containers et on les créé sinon
  /**
   * Le conteneur html pour afficher la ressource, passé en options ou pris dans le dom si #display
   * @type {Element}
   */
  var container = options.container || wd.getElementById('display')
  /**
   * Le conteneur html pour afficher d'éventuelles erreurs, passé en options ou pris dans le dom si #errors
   * @type {Element}
   */
  var errorsContainer = options.errorsContainer || wd.getElementById('errors')
  if (!errorsContainer) errorsContainer = dom.addElement(wd.getElementsByTagName('body')[0], 'div', {id: 'errors'})
  if (!container) container = dom.addElement(wd.getElementsByTagName('body')[0], 'div', {id: 'display'})
  // et on ajoute ces deux éléments aux options
  options.container = container
  options.errorsContainer = errorsContainer

  // on regarde si d'autres options ont été passé en GET
  var paramGet
  ["resultatMessageAction", "urlResultatCallback", "userOrigine", "userId"].forEach(function (param) {
    paramGet = tools.getURLParameter(param)
    if (!options[param] && paramGet) options[param] = paramGet
  })
  paramGet = tools.getURLParameter("showTitle")
  if (paramGet === "0" || paramGet === "false") options.showTitle = false

  // terminé
  if (next) next()
}

/**
 * Pour charger des modules référencé ici en async, avec headJs
 * @param {Array} moduleNames
 * @param callback
 */
function loadAsync(moduleNames, callback) {
  /*global head*/
  var paths = [], errors = [], path
  var loader = head.load || head.js // les anciennes versions de head utilisaient head.js avec la même signature
  moduleNames.forEach(function (moduleName) {
    path = externalModules[moduleName]
    if (path) paths.push(path)
    else errors.push(moduleName)
  })
  if (errors.length) addError("Impossible de le ou les modules inconnus suivants " +errors.join(", "))
  else if (paths.length) loader(paths, callback)
  else log.error("appel de loadAsync sans modules")
}

/**
 * Change la base (pour la mettre absolue après chargement de ce module en cross domain)
 * @param newBase
 */
function setBase(newBase) {
  base = newBase
}

/**
 * Module de base pour les méthodes spécifiques à sesatheque et son dom (addError, hideTitle)
 * @module page
 */
module.exports = {addError, hideTitle, init, loadAsync, setBase}


/**
 * Options à passer à init() ou à display(), les autres propriétés seront laissées intactes
 * @typedef initOptions
 * @type {Object}
 * @property {string}  [base=/] Le préfixe de chemin vers la racine de la sésathèque.
 *                                        Il faut passer un chemin http://… complet si ce module est utilisé sur un autre domaine que la sésathèque
 *                                        Inutile si l'info a déjà été donnée à requireConfig avant
 * @property {Element} [container]        L'élément html qui servira de conteneur au plugin pour afficher sa ressource, créé si non fourni
 * @property {Element} [errorsContainer]  L'élément html pour afficher des erreurs éventuelles, créé si non fourni
 * @property {boolean} [verbose=false]      Passer true pour ajouter des log en console
 */

/**
 * Options à passer à une méthode display d'un plugin
 * @typedef displayOptions
 * @type {Object}
 * @property {string}           base        Le préfixe de chemin vers la racine de la sésathèque (chemin http absolu en cas d'appel d'un autre domaine)
 * @property {string}           pluginBase            Le préfixe de chemin vers le dossier du plugin (mis par display)
 * @property {Element}          container             L'élément html qui servira de conteneur au plugin pour afficher sa ressource
 * @property {Element}          errorsContainer       L'élément html pour afficher des erreurs éventuelles
 * @property {boolean}          [verbose=false]       Passer true pour ajouter des log en console
 * @property {boolean}          [isDev=false]         Passer true pour initialiser le dom source en devsesamath (pour certains plugins)
 * @property {string}           [urlResultatCallback] Une url vers laquelle poster le résultat
 *                                                    (idem si la page de la ressource contient ?urlScoreCallback=http…)
 * @property {string}           [resultatMessageAction] Un nom d'action pour passer le résultat en postMessage
 * @property {resultatCallback} [resultatCallback]    Une fonction pour recevoir un objet Resultat (si y'a pas de urlScoreCallback)
 * @property {string}           [sesatheque]          Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page),
 *                                                      le nom de la sésathèque pour un client qui récupère des résultats de plusieurs sésatheques
 * @property {boolean}          [showTitle=true]      Passer "0" ou "false" via l'url ou false via options pour cacher le titre
 * @property {string}           [userOrigine]         Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page)
 * @property {string}           [userId]              Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page)
 * @property {object}           [flashvars]           Pour les plugins qui chargent du swf, sera passé en flashvars en plus
 */

/**
 * @callback resultatCallback
 * @param {Resultat} Un objet Resultat
 */

/**
 * Un élément du Dom HTML
 * @typedef Element
 * @type {Object}
 * @see https://developer.mozilla.org/fr/docs/Web/API/Element
 */

