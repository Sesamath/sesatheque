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

module.exports = function (controller) {
  var tools = require('../tools')
  // var _ = require('lodash')
  var $cache = lassi.service('$cache')

  function getDefaultData () {
    return {
      contentBloc: {
        $view: 'debug'
      }
    }
  }

  /**
   * Une route pour afficher des objets en dev (debug)
   */
  controller.get('session', function (context) {
    context.layout = 'page'
    // on ajoute un compteur pour vérifier que ça s'incrémente de 1 à chaque affichage
    if (context.session.compteur) context.session.compteur++
    else context.session.compteur = 1
    var data = getDefaultData()
    data.$metas = {title: 'La session courante'}
    data.contentBloc.debug = tools.stringify(context.session, 2)
    context.html(data)
  })

  controller.get('request', function (context) {
    context.layout = 'page'
    var data = getDefaultData()
    data.contentBloc.debug = tools.stringify(context.request)
    context.html(data)
  })

  controller.get('response', function (context) {
    context.layout = 'page'
    var data = getDefaultData()
    data.contentBloc.debug = tools.stringify(context.response)
    context.html(data)
  })

  // un controleur tout prêt pour tout et n'importe quoi
  controller.get('test', function (context) {
    context.layout = 'page'
    var data = getDefaultData()
    data.contentBloc.debug = tools.stringify({foo: 'bar'})
    context.html(data)
  })

  // renvoie en json ce que l'on reçoit en post
  controller.post('ping', function (context) {
    context.json(context.post)
  })

  // Renvoie {result:'ok'}
  controller.get('resultOk', function (context) {
    context.json({result: 'ok'})
  })

  // Renvoie {error:'Une erreur déclenchée exprès'}
  controller.get('resultKo', function (context) {
    context.json({error: 'Une erreur déclenchée exprès'})
  })

  // déclenche une erreur 500
  controller.get('erreur500', function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    throw new Error('Une erreur 500 provoquée')
  })

  // pour afficher une erreur passée en get
  controller.get('error', function (context) {
    var error = context.get.error || 'demande d’affichage d’erreur sans erreur fournie'
    context.layout = 'page'
    throw new Error(error)
  })

  // un formulaire de login
  controller.get('login', function (context) {
    context.layout = 'page'
    var data = getDefaultData()
    data.contentBloc.debug = 'page de login factice'
    context.html(data)
  })

  // une page pour voir le cache
  controller.get('cache/:key', function (context) {
    var key = context.arguments.key
    $cache.get(key, function (error, data) {
      if (error) context.json({error: error.toString()})
      else if (data) context.json(data)
      else context.json({success: true, message: 'la clé ' + key + ' n’existait pas en cache'})
    })
  })
  // une autre pour l'effacer
  controller.get('purgeCache/:key', function (context) {
    var key = context.arguments.key
    $cache.delete(key, function (error) {
      if (error) context.json({error: error.toString()})
      else context.json({success: true, message: 'clé ' + key + ' effacée'})
    })
  })
}
