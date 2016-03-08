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

var dom = require('sesajstools/dom')
var log = require('sesajstools/utils/log')
var tools = require('sesajstools')

var page = require('../../page/index')
var swf = require('../../display/swf')

/**
 * Affiche la ressource ec2 (exercices calculatice en flash)
 * @service plugins/ec2/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Possibilité de passer ec2Base pour modifier http://ressources.sesamath.net/replication_calculatice/flash
 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
 */
module.exports = function display (ressource, options, next) {
  try {
    var ec2Base = tools.getURLParameter('ec2Base') || options.ec2Base || 'http://ressources.sesamath.net/replication_calculatice/flash'
    var swfUrl

    log('start ec2 display avec la ressource', ressource)
    // les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.swf) {
      throw new Error('Paramètres manquants')
    }
    // le swf
    swfUrl = ec2Base + '/' + ressource.parametres.swf
    // les fcts exportées pour le swf
    var optionsChargement = ressource.parametres.json || 'defaut'
    window.charger_options = function () {
      return optionsChargement
    }

    window.enregistrer_score = function (datasCalculatice) {
      if (options && options.resultatCallback) {
        log('résultats reçus', datasCalculatice)
        options.resultatCallback({reponse: datasCalculatice})
      }
    }

    // On réinitialise le conteneur
    dom.empty(options.container)

    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
    options.container.setAttribute('width', 735) // change rien avec ff
    options.container.style.width = '735px'

    var swfOptions = {
      largeur: 735,
      hauteur: 450,
      base: ec2Base + '/',
      flashvars: {
        contexte: 'LaboMEP', // encore utile ça ?
        statut: 'eleve'
      }
    }

    swf.load(options.container, swfUrl, swfOptions, next)
  } catch (error) {
    if (next) next(error)
    else page.addError(error)
  }
}
