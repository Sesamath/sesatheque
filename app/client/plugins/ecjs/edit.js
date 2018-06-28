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

const dom = require('sesajstools/dom')

const page = require('../../page/index')
const display = require('./display')

// récupérer cette liste avec (sur le site ressources)
// ls -1 replication_calculatice/javascript/exercices/|tr '\n' ','|sed -e 's/,/', '/g'
// et virer complement et lang
const typesEc = ['addiclic',
  'approximationsomme',
  'balance',
  'balanceadd',
  'basketmath',
  'basketmath2p',
  'basketmath3p',
  'bocal',
  'bouleetboule',
  'bouleetbouledecimaux',
  'calculdiffere',
  'carre',
  'chocolat1',
  'chocolat2',
  'cibles',
  'complement',
  'croupier',
  'decollage',
  'diviclic',
  'elephants',
  'estimation',
  'frise',
  'grenouille',
  'lacaisse',
  'lebanquier',
  'lesbornes',
  'mbrique',
  'memory',
  'mistral',
  'multiclic',
  'nombresympathique',
  'numbercrushdecimaux',
  'oiseauaddition',
  'oiseaumultiplication',
  'operationsatrous',
  'planeteaddition',
  'quadricalc',
  'quadricalcinv',
  'recette',
  'rectangle',
  'sommeenligne',
  'supermarche',
  'surfacebleue',
  'tableattaque',
  'tapisdecarte',
  'train',
  'viaduc'
]

/**
 * Édite une ressource ecjs
 * @service plugins/ecjs/edit
 * @param ressource
 * @param options
 */
module.exports = function edit (ressource, options) {
  require.ensure(['jquery'], function (require) {
    // ajoute le select dans le dom
    function addSelect (ressource, options) {
      // on ajoute select et un nouveau container
      const select = dom.addElement(options.container, 'select')
      dom.addElement(select, 'option', {id: 'selectFichier', value: 0}, "Choisir un type d'exercice")
      typesEc.forEach(function (typeEc) {
        dom.addElement(select, 'option', {value: typeEc}, typeEc)
      })
      const $select = $(select)
      $select.on('change', function () {
        const sExo = $select.val()
        if (sExo) {
          if (!ressource.parametres) ressource.parametres = {}
          ressource.parametres.fichierjs = sExo
          $select.hide()
          displayEcOptions(ressource, options)
        }
      })
      // et le nouveau container après ce select
      const divClc = dom.addElement(options.container, 'div')
      options.container = divClc
    }

    // affiche calculatice en mode paramétrage
    function displayEcOptions (ressource, options) {
      options.optionsClcCallback = function (optionsClc) {
        ressource.parametres.options = optionsClc
      }
      // on lance un display ordinaire (c'est lui qui clique sur le bouton des options de l'exo
      // s'il a un optionsClcCallback
      display(ressource, options, function (error) {
        if (error) page.addError(error)
        const getParametres = () => ressource.parametres
        if (options.loadEditCb) options.loadEditCb(null, getParametres)
      })
    }

    const $ = require('jquery')
    if (!ressource || !ressource.parametres) throw new Error('Il faut passer une ressource à éditer')
    if (ressource.parametres.fichierjs) {
      displayEcOptions(ressource, options)
    } else {
      addSelect(ressource, options)
    }
  })
}
