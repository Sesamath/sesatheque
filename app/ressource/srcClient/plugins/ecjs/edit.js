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

var page = require('../../page')
var dom = require('../../tools/dom')
var log = require('../../tools/log')
var $ = window.jQuery
var display = require('./display')

function addSelect(ressource, options) {
  var select = dom.getElement("select")
  dom.addElement(select, 'option', {id:'selectFichier', value:0}, "Choisir un type d'exercice")
  typesEc.forEach(function (typeEc) {
    dom.addElement(select, 'option', {value:typeEc}, typeEc)
  })
  $textarea.before(select)
  $textarea.hide()
  // code piqué dans http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript/api/
  var $select = $(select)
  $select.on("change", function() {
    var sExo = $select.val()
    if (sExo) {
      if (!ressource.parametres) ressource.parametres = {}
      ressource.parametres.fichierjs = sExo
      $select.hide()
      $textarea.show()
      displayEcOptions(ressource, options)
    }
  })
}

function displayEcOptions(ressource, options) {
  var submitAsked = false
  var submitDone = false
  var $form = $("#formRessource")
  $form.submit(function () {
    if (!submitDone) {
      submitAsked = true
      $('button.tester-parametre').click()
      setTimeout(function () {
        if (!submitDone) {
          log("On a pas récupéré les options après 2s d'attente, on poste tel quel")
          submitDone = true
          $form.submit()
        }
      }, 2000)
    }

    return submitDone
  })
  options.optionsClcCallback = function (optionsClc) {
    log("dans edit on récupère les options", optionsClc)
    try {
      var parametres = JSON.parse($textarea.val())
      if (!parametres) {
        log.error("parametres vide quand on voulait affecter options (il devrait y avoir fichierjs)")
        parametres = {}
      }
      if (!parametres.fichierjs && ressource.parametres.fichierjs) parametres.fichierjs = ressource.parametres.fichierjs
      parametres.options = optionsClc
      // sans le setTimeout, le $textarea.val(string) ne change rien dans le html, aucune idée du pourquoi...
      setTimeout(function () {
        $textarea.val(JSON.stringify(parametres, null, 2))
        if (submitAsked) {
          submitDone = true
          log("on lance le submit avec " + $textarea.val())
          $form.submit()
        }
      }, 0)
    } catch (error) {
      page.addError("la modification des paramètres a échoué")
    }
  }
  display(ressource, options, function (error) {
    if (error) page.addError(error)
  })
}

function ecJsEdit(ressource, options) {
  if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer")
  var textarea = window.document.getElementById('parametres')
  if (!textarea) throw new Error("Pas de textarea #parametres trouvé dans cette page")
  $textarea = $(textarea)
  log("les options dans ecjs/edit.init", options)
  if (ressource.parametres.fichierjs) {
    displayEcOptions(ressource, options)
  } else {
    addSelect(ressource, options)
  }
}

/* jshint jquery:true */
var $textarea

// récupérer cette liste avec (sur le site ressources)
// ls -1 replication_calculatice/javascript/exercices/|tr '\n' ','|sed -e 's/,/", "/g'
// et virer complement et lang
var typesEc = ["addiclic",
  "approximationsomme",
  "balance",
  "balanceadd",
  "basketmath",
  "basketmath2p",
  "basketmath3p",
  "bocal",
  "bouleetboule",
  "bouleetbouledecimaux",
  "calculdiffere",
  "carre",
  "chocolat1",
  "chocolat2",
  "cibles",
  "complement",
  "croupier",
  "decollage",
  "diviclic",
  "elephants",
  "estimation",
  "frise",
  "grenouille",
  "lacaisse",
  "lebanquier",
  "lesbornes",
  "mbrique",
  "memory",
  "mistral",
  "multiclic",
  "nombresympathique",
  "numbercrushdecimaux",
  "oiseauaddition",
  "oiseaumultiplication",
  "operationsatrous",
  "planeteaddition",
  "quadricalc",
  "quadricalcinv",
  "recette",
  "rectangle",
  "sommeenligne",
  "supermarche",
  "surfacebleue",
  "tableattaque",
  "tapisdecarte",
  "train",
  "viaduc"
]

module.exports = ecJsEdit