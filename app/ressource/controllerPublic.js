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

/**
 * Le controleur html des routes /public/ (pages sans authentification)
 * qui traite aussi les /ressource/ si on est pas authentifié
 *
 * La session n'est pas utilisée ici (varnish a viré les cookies en amont pour mettre ces pages en cache)
 * @controller controllerPublic
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourcePage, $routes, $cache) {
  var _ = require('lodash')
  var request = require('request')
  var tools = require('../tools')
  var config = require('./config')

  /**
   * Charge une ressource publique (d'après context.arguments.oid) et l'envoie à la vue
   * @private
   * @param {Context} context
   * @param view
   * @param options
   */
  function affiche (context, view, options) {
    var oid = context.arguments.oid
    $ressourceRepository.loadPublic(oid, function (error, ressource) {
      $ressourcePage.prepareAndSend(context, error, ressource, view, options)
    })
  }

  /**
   * Vérifie qu'une ressource est publique puis l'envoie à la vue
   * @private
   * @param {Context} context
   * @param error
   * @param ressource
   * @param view
   * @param options
   */
  function checkAndAffiche (context, error, ressource, view, options) {
    if (error) $ressourcePage.printError(context, "Problème d'accès à la base de données", 500)
    else if (ressource && ressource.restriction === 0) $ressourcePage.prepareAndSend(context, error, ressource, view, options)
    else $ressourcePage.printError(context, "La ressource n'existe pas ou n'est pas publique", 404)
  }

  /**
   * Page describe
   * @route GET /public/decrire/:oid
   */
  controller.get($routes.get('describe', ':oid'), function (context) {
    context.layout = 'page'
    context.tab = 'describe'
    affiche(context, 'describe')
  })
  /**
   * Page describe
   * @route GET /public/decrire/:origine/:idOrigine
   */
  controller.get($routes.get('describe', ':origine', ':idOrigine'), function (context) {
    context.layout = 'page'
    context.tab = 'describe'
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      checkAndAffiche(context, error, ressource, 'describe')
    })
  })

  /**
   * Page display (pleine page, prévu pour iframe)
   * @route GET /public/voir/:oid
   */
  controller.get($routes.get('display', ':oid'), function (context) {
    context.layout = 'iframe'
    affiche(context, 'display')
  })
  /**
   * Page display (pleine page, prévu pour iframe)
   * @route GET /public/voir/:origine/:idOrigine
   */
  controller.get($routes.get('display', ':origine', ':idOrigine'), function (context) {
    context.layout = 'iframe'
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    if (origine === 'cle') {
      $ressourceRepository.loadByCle(idOrigine, function (error, ressource) {
        // on fait sauter la restriction si c'est une ressource publiée dont on connait la clé
        if (!error && ressource && ressource.publie) ressource.restriction = 0
        checkAndAffiche(context, error, ressource, 'display')
      })
    } else {
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        checkAndAffiche(context, error, ressource, 'display')
      })
    }
  })
  /**
   * Page preview (avec le layout du site)
   * @route GET /public/apercevoir/:oid
   */
  controller.get($routes.get('preview', ':oid'), function (context) {
    context.layout = 'page'
    context.tab = 'preview'
    affiche(context, 'display')
  })
  /**
   * Page preview (avec le layout du site)
   * @route GET /public/apercevoir/:origine/:idOrigine
   */
  controller.get($routes.get('preview', ':origine', ':idOrigine'), function (context) {
    context.layout = 'page'
    context.tab = 'preview'
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      checkAndAffiche(context, error, ressource, 'display')
    })
  })

  /**
   * La recherche (form et résultats)
   * @private
   */
  function search (context) {
    context.layout = 'page'
    if (_.isEmpty(context.get)) {
      // form de recherche
      $ressourcePage.printSearchForm(context)
    } else {
      // résultats
      log.debug('search reçoit', context.get)
      // faut passer en revue les critères
      var filters = []
      var crit = context.get
      var filter

      // les filtres, parmi les propriétés défini en conf
      for (var prop in crit) {
        if (crit.hasOwnProperty(prop) && config.labels.hasOwnProperty(prop) && crit[prop]) {
          filter = {
            index: prop,
            values: _.isArray(crit[prop]) ? crit[prop] : [crit[prop]]
          }
          filters.push(filter)
        }
      }
      log.debug('traduits en filters', filters)
      // @todo ajouter des critères de tri
      if (filters.length) {
        var options = {
          filters: filters
        }
        // getListe vérifiera que ces valeurs sont acceptables, mais on veut des entiers
        options.start = parseInt(crit.start, 10) || 0
        options.nb = parseInt(crit.nb, 10) || 25
        options.orderBy = crit.orderBy || 'oid'
        $ressourceRepository.getListe('public', options, function (error, ressources) {
          var data = $ressourcePage.getDefaultData('liste')
          data.$metas.title = 'Résultats de la recherche'
          log.debug('liste avec les options', options)
          log.debug('qui remonte', ressources)
          if (error) data.contentBloc.error = error.toString()
          else {
            if (ressources.length === options.nb) {
              crit.start = options.start + options.nb
              data.contentBloc.linkPageNext = tools.linkQs($routes.get('search'), 'Résultats suivants', crit)
            }
            if (options.start) {
              crit.start = options.start - options.nb
              if (crit.start < 0) crit.start = 0
              data.contentBloc.linkPagePrev = tools.linkQs($routes.get('search'), 'Résultats précédents', crit)
            }
            if (ressources.length) data.contentBloc.pagination = '(' + (options.start + 1) + ' à ' + (options.start + 1 + ressources.length) + ')'
            data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources)
          }
          context.html(data)
        })
      } else {
        $ressourcePage.printSearchForm(context, ['il faut choisir au moins un critère'])
      }
    }
  }
  search.timeout = 3000
  /**
   * Formulaire de recherche et affichage des résultats
   * @route GET /public/recherche
   */
  controller.get($routes.get('search'), search)
  /**
   * Un proxy pour les pages externes en http (mais pas https)
   * @route GET /public/urlProxy/:oid
   */
  controller.get('urlProxy/:oid', function (context) {
    function sendRawHtml (body, contentType) {
      var options = {
        headers: {
          'Content-Type': contentType
        }
      }
      context.raw(body, options)
    }

    var oid = context.arguments.oid

    $ressourceRepository.load(oid, function (error, ressource) {
      if (error) {
        log.error(error)
        context.text(error.toString())
      } else if (ressource && ressource.type === 'url') {
        var url = ressource && ressource.parametres && ressource.parametres.adresse
        if (url && url.substr(0, 7) === 'http://') {
          var cacheKey = 'urlProxy' + oid
          var page = $cache.get(cacheKey)
          if (page && page.body) {
            sendRawHtml(page.body, page.contentType)
          } else {
            // faut aller le chercher
            var options = {
              url: url,
              timeout: 5000,
              gzip: true
            }
            request(options, function (error, response, body) {
              if (!error && response.statusCode === 200) {
                // on met ça en cache pendant 10min
                var page = {
                  body: body,
                  contentType: response.headers['content-type'] || 'text/html'
                }
                $cache.set('urlProxy' + oid, page, 600)
                sendRawHtml(page.body, page.contentType)
              } else {
                context.text('Impossible de récupérer la page ' + url)
              }
            })
          }
        } else {
          var msg = 'La ressource ' + oid + ' n’a pas d’adresse en http://…'
          log.error(msg)
          context.text(msg)
        }
      } else {
        context.text('Il n’y a pas de ressource ' + oid + ' de type page externe')
      }
    })
  })
}
