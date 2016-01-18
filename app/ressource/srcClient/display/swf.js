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
var page = require('../page')
//var dom = require('../tools/dom')
var log = require('../tools/log')

/**
 * @file Un module js pour charger un swf dans un container, utilisé par plusieurs plugins de ressources, 
 * utilise swfobject mis en global
 */
var swfobject = window.swfobject

/**
 * Charge un swf dans l'élément container
 * @memberOf tools/swf
 * @param {Element}        container L'élément html dans lequel on ajoutera
 * @param {string}         swfHref   Le chemin vers le swf à charger
 * @param {swfloadOptions} [options] Des paramètres utilisés pour le chargement
 * @param {errorCallback}  next      Appelé quand le swf est chargé (mais pas forcément tout ce qu'il charge lui-même)
 */
function load(container, swfHref, options, next) {
  /**
   * Callback appelée après le chargement de swfobject
   * @private
   * @param {Event} e
   */
  function callbackFn(e) {
    if (!next) next = function () {}
    if (e) {
      if (e.success) {
        log("Lancement de " + swfHref + ' réussi')
        next()
      } else {
        var errorMsg = "Javascript fonctionne mais votre navigateur ne supporte pas les éléments Adobe Flash, impossible d'afficher cette ressource."
        page.addError(errorMsg)
        next(new Error(errorMsg))
      }
    } else {
      log('callback de chargement appelée sans argument')
    }
  }

  var wd = window.document
  var htmlElt, largeur, hauteur, flashversion, flashvars, swfParams, swfAttributes
  // l'id du div html que l'on créé, qui sera remplacé par un tag object pour le swf
  var divId = options.id || 'sesaSwf' +(new Date()).getTime()

  // le message en attendant le chargement
  htmlElt = wd.createElement("div")
  htmlElt.id = divId
  htmlElt.appendChild(wd.createTextNode("Chargement de la ressource en cours"))
  container.appendChild(htmlElt)

  flashvars = options.flashvars || {}

  // les params pour le player
  swfParams = {
    "menu" : "false",
    "wmode": "window",
    "allowScriptAccess": "always" // important pour que le swf puisse communiquer avec le js de cette page
  }
  if (options.base) swfParams.base = options.base
  // et les attributs pour le loader swfobject.embedSWF
  swfAttributes = {
    id: divId,
    name: divId
  }
  largeur = options.largeur || 400
  hauteur = options.hauteur || 400
  flashversion = options.flashversion || '8'

  // swfobject.embedSWF (swfUrl, htmlId, largeur, hauteur, version_requise,
  //    expressInstallSwfurl, flashvars, params, attributes, callbackFn)
  swfobject.embedSWF(swfHref, divId, largeur, hauteur, flashversion, null, flashvars, swfParams, swfAttributes, callbackFn)
}

module.exports = {load}

/**
 * @typedef swfloadOptions
 * @type {Object}
 * @param {string} [id]        Id du div html que l'on va créer
 * @param {Object} [flashvars] Les flashvars qui seront passées au swf
 * @param {string} [base]      Une base à passer en paramètre au swf, tous les load lancés par le swf seront traité en relatif à cette base
 * @param {Integer} [hauteur=400] La hauteur d'affichage imposée au swf
 * @param {Integer} [largeur=400] La largeur d'affichage imposée au swf
 */

