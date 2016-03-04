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

var page = require('../../page')
var dom = require('../../tools/dom')
// var log = require('../../tools/log')
var formEditor = require('../../edit/formEditor')

/* jshint jquery:true */
var $
var $parametresUrl
var $xmlElt

function importXml () {
  var url = $parametresUrl.val()
  if (url && url.substr(0, 4) === 'http') {
    $.ajax({
      url: url,
      dataType: 'text', // sinon jQuery le converti en objet, idiot puisqu'on veut la string
      success: function (data) {
        $xmlElt.val(data)
      }
    }).fail(function () {
      page.addError('La récupération du script iep sur ' + url + ' a échoué')
    })
  } else {
    page.addError('Il faut préciser une url absolue (http…)')
  }
}

/**
 * Édite les paramètres d'une ressource iep
 * @service plugins/iep/edit
 */
module.exports = function edit (ressource) {
  try {
    page.loadAsync(['jquery'], function () {
      $ = window.jQuery
      if (!ressource || !ressource.parametres) throw new Error('Il faut passer une ressource à éditer')
      var parametres = ressource.parametres
      var groupParametres = window.document.getElementById('groupParametres')
      if (!groupParametres) throw new Error('Pas de conteneur #groupParametres trouvé dans cette page')
      formEditor.addInputText(
        groupParametres,
        { name: 'parametres[width]', size: 5, value: parametres.width || '', placeholder: 'largeur' },
        { label: 'largeur', remarque: '(en pixels)' }
      )
      formEditor.addInputText(
        groupParametres,
        {
          name: 'parametres[height]',
          size: 5,
          value: parametres.height || '',
          placeholder: 'hauteur',
          'class': 'center'
        },
        { label: 'hauteur', remarque: '(en pixels)' }
      )
      $parametresUrl = $(formEditor.addInputText(
        groupParametres,
        {
          name: 'parametres[url]',
          id: 'parametresUrl',
          size: 80,
          value: parametres.url || '',
          placeholder: 'Entrer une url absolue (http…)'
        },
        { label: 'url', remarque: '(ira lire le script de cette url à chaque affichage si le champ xml est vide)' }
      ))
      var xmlWrapper = formEditor.addFormGroup(groupParametres, 'after')
      var link = dom.addElement(xmlWrapper, 'p')
      dom.addElement(link, 'a', { href: '#parametres[xml]' }, 'importer le script').addEventListener('click', importXml)
      dom.addElement(link, 'span', { 'class': 'remarque' }, '(une fois pour toute, si la source change ou disparait cette ressource restera identique)')
      var xmlElt = formEditor.addTextarea(
        xmlWrapper,
        { name: 'parametres[xml]', cols: 80, rows: 20, style: { resize: 'both' } },
        { label: 'Script instrumenpoche' }
      )
      $xmlElt = $(xmlElt)
      $('form#formRessource').submit(function () {
        var url = $parametresUrl.val()
        var xml = $xmlElt.val()
        var retour = false
        if (url && /https?:\/\/[a-z][a-z0-9\-_\.]+\.[a-z]+\/.+/.test(url)) retour = true
        else if (url) page.addError('Url invalide')
        else if (xml) retour = true
        else page.addError('Il faut au moins une url ou un script')
        if (!retour) $(document).scrollTop(0)

        return retour
      })
    })
  } catch (error) {
    page.addError(error)
  }
}
