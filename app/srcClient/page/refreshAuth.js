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

var xhr = require('sesajstools/http/xhr')
var dom = require('sesajstools/dom')
var log = require('sesajstools/utils/log')

function addLink (parent, link) {
  var li = dom.getElement('li')
  var aOptions = {}
  if (link.href) aOptions.href = link.href
  if (link.selected) aOptions.class = 'selected'
  if (link.icon) aOptions.title = link.value
  var a = dom.getElement('a', aOptions)
  if (link.icon) {
    dom.addElement(a, 'i', {class: 'fa fa-' + link.icon})
    dom.addElement(a, 'span', {}, link.value)
  } else if (link.iconStack) {
    var spanStack = dom.getElement('span', {class: 'fa-stack fa-lg'})
    link.iconStack.forEach(function (icon) {
      dom.addElement(spanStack, 'i', {class: 'fa fa-' + icon})
    })
    a.appendChild(spanStack)
    dom.addElement(a, 'span', {}, link.value)
  } else {
    dom.addText(a, link.value)
  }
  li.appendChild(a)
  parent.appendChild(li)
}

/**
 * Met à jour l'affichage des infos du user sur les pages publiques (dont le source est en cache, en version non authentifié)
 * (vérifie si on est authentifié avec un appel ajax, pour ajouter les infos et les boutons qui vont bien)
 */
module.exports = function () {
  if (window.location.pathname.indexOf('/public/') > -1) {
    var url = '/api/auth'
    // on regarde si on est sur une ressource
    var match = window.location.pathname.match(/\/public\/[a-z]+\/(.+)$/)
    if (match) url += '?ressourceId=' + match[1]
    xhr.get(url, {withCredentials: true, responseType: 'json'}, function (error, response) {
      log.enable()
      log('on récupère auth', response)
      if (error) {
        log.error(error)
      } else if (response && response.isLogged) {
        if (response.authBloc) {
          var data = response.authBloc
          var authBloc = document.getElementById('auth')
          if (authBloc) {
            // Cf views/auth.dust
            dom.empty(authBloc)
            var a = dom.addElement(authBloc, 'a', {href: '#'})
            dom.addElement(a, 'i', {class: 'fa fa-user'})
            dom.addText(a, ' ')
            dom.addElement(a, 'i', {class: 'fa fa-ellipsis-v'})
            var ul = dom.addElement(authBloc, 'ul')
            dom.addElement(ul, 'div', {}, data.user.prenom + ' ' + data.user.nom)
            data.ssoLinks.forEach(function (link) {
              addLink(ul, link)
            })
            addLink(ul, data.logoutLink)
          }
        } else {
          log.error("pas de authBloc dans la réponse de l'api")
        }
        // on passe aux boutons d'action si on est sur une ressource
        if (response.permissions && document.getElementById('actions')) {
          if (response.permissions.indexOf('C') > -1) dom.setStyles(document.getElementById('buttonDuplicate'), {display: 'block'})
          if (response.permissions.indexOf('D') > -1) dom.setStyles(document.getElementById('buttonDelete'), {display: 'block'})
          if (response.permissions.indexOf('W') > -1) dom.setStyles(document.getElementById('buttonEdit'), {display: 'block'})
        }
        // la navigation
        if (response.permissions.indexOf('C') > -1) dom.setStyles(document.getElementById('buttonAdd'), {display: 'inline-block'})
        var buttonMyRessources = document.getElementById('buttonMyRessources')
        if (buttonMyRessources && response.oid) {
          buttonMyRessources.href += response.oid
          dom.setStyles(buttonMyRessources, {display: 'inline-block'})
        }
        var buttonSearch = document.getElementById('buttonSearch')
        if (buttonSearch) buttonSearch.href = buttonSearch.href.replace('public', 'ressource')
      }
    })
  }
}
