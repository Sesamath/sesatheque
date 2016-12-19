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
 * Script indépendant pour l'import (appelle l'api) et valide si ok ou affiche une erreur
 */
'use strict'

var page = require('../page/index')
var sjtUrl = require('sesajstools/http/url')
var dom = require('sesajstools/dom')
var xhr = require('sesajstools/http/xhr')

function doImport (url) {
  // on cherche base et id
  var base
  var id
  var matches = /^(https?:\/\/[a-z0-9\-._]+(?::[0-9]+)?\/)(.+)/.exec(url)
  // console.log('matches', matches)
  if (matches) {
    base = matches[1]
    var pathChunks = matches[2].split('/')
    // console.log('chunks', pathChunks)
    if (pathChunks[0] === 'api' || pathChunks[0] === 'ressource' || pathChunks[0] === 'public') {
      // 1 est ressource|public sur l'api, le verbe sinon, on prend le reste
      id = pathChunks.slice(2).join('/')
    } else {
      throw new Error('L’url ne semble pas correspondre à une ressource')
    }
  } else {
    throw new Error('Url invalide')
  }

  // si on est encore là on peut faire notre appel ajax
  var urlSrc = '/api/externalClone/' + id
  var options = {
    urlParams: {
      base: base
    },
    withCredentials: true,
    responseType: 'json'
  }
  xhr.get(urlSrc, options, function (error, data) {
    // console.log('retour externalClone', error, data)
    if (error) page.addError(error)
    else if (data && data.error) page.addError(data.error)
    else if (data && data.ref) window.location = '/ressource/modifier/' + data.ref
    else page.addError('L’import a échoué, vérifier l’url fournie')
  })
}

/**
 * Importe une ressource externe (via l'api)
 * @service edit/import
 */
module.exports = function importByUrl () {
  var options = {}
  page.init(options, function () {
    try {
      dom.empty(options.container)
      dom.addElement(options.container, 'p', null, 'Indiquer ci-dessous l’url absolue de la ressource à importer dans vos ressources')
      var attrs = {type: 'text', placeholder: 'Url absolue de la ressource à importer', style: {margin: '1em', width: '80%'}}
      var url = sjtUrl.getParameter('url')
      if (url) attrs.value = url
      var urlImportElt = dom.addElement(options.container, 'input', attrs)
      var importButtonElt = dom.addElement(options.container, 'button', null, 'Importer')
      importButtonElt.addEventListener('click', function () {
        try {
          var urlImport = urlImportElt.value
          if (urlImport && urlImport.substr(0, 4) !== 'http') throw new Error('Url invalide, il faut une adresse absolue (qui commence par https:// ou http://…)')
          else doImport(urlImport)
        } catch (error) {
          page.addError(error, 5)
        }
      })
    } catch (error) {
      page.addError(error)
    }
  })
}
