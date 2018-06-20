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

const _ = require('lodash')
const request = require('request')
const {ensure, linkQs} = require('../tools')
const config = require('./config')

/**
 * Une callback qui ne fait rien sinon logguer une éventuelle erreur
 * @private
 */
function logIfError (error) {
  if (error) log.error(error)
}

/**
 * Le controleur html des routes /public/ (pages sans authentification)
 * qui traite aussi les /ressource/ si on est pas authentifié
 *
 * La session n'est pas utilisée ici (varnish a viré les cookies en amont pour mettre ces pages en cache)
 * @controller controllerPublic
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourcePage, $routes, $cache, $accessControl) {
  /**
   * Charge une ressource publique (d'après context.arguments.oid) et l'envoie à la vue
   * @private
   * @param {Context} context
   * @param view
   * @param options
   */
  function affiche (context, view, options) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      if (error) return $ressourcePage.printError(context, error, 500)
      if (!ressource) return $ressourcePage.printError(context, 'Cette ressource n’existe pas', 404)
      if (!$accessControl.isPublic(ressource)) return $ressourcePage.printError(context, `La ressource ${ressource.oid} n’est pas publique`, 403)
      $ressourcePage.prepareAndSend(context, null, ressource, view, options)
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
    if (error) return $ressourcePage.printError(context, error)
    if (!ressource) return $ressourcePage.printError(context, 'Cette ressource n’existe pas', 404)
    if (!$accessControl.isPublic(ressource)) return $ressourcePage.printError(context, `La ressource ${ressource.oid} n’est pas publique`, 403)
    $ressourcePage.prepareAndSend(context, null, ressource, view, options)
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
            values: Array.isArray(crit[prop]) ? crit[prop] : [crit[prop]]
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
        options.skip = ensure(crit.skip, 'integer', 0)
        options.limit = ensure(crit.limit, 'integer', 25)
        options.orderBy = crit.orderBy || 'dateCreation'
        $ressourceRepository.getListe('public', options, function (error, ressources) {
          var data = $ressourcePage.getDefaultData('liste')
          data.$metas.title = 'Résultats de la recherche'
          if (error) {
            data.contentBloc.error = error.toString()
          } else {
            if (ressources.length === options.limit) {
              crit.skip = options.skip + options.limit
              data.contentBloc.linkPageNext = linkQs($routes.get('search'), 'Résultats suivants', crit)
            }
            if (options.skip) {
              crit.skip = options.skip - options.limit
              if (crit.skip < 0) crit.skip = 0
              data.contentBloc.linkPagePrev = linkQs($routes.get('search'), 'Résultats précédents', crit)
            }
            if (ressources.length) data.contentBloc.pagination = '(' + (options.skip + 1) + ' à ' + (options.skip + 1 + ressources.length) + ')'
            data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources) // inutile de passer le context si on est pas authentifié
          }
          context.html(data)
        })
      } else {
        $ressourcePage.printSearchForm(context, ['il faut choisir au moins un critère'])
      }
    }
  }
  // avec mysql ça peut être vraiment très lent… (3s pour le count et 3s pour remonter les data)
  search.timeout = 10000

  /**
   * Formulaire de recherche et affichage des résultats
   * @route GET /public/recherche
   */
  controller.get($routes.get('search'), search)

  /**
   * Récupère une donnée exterieur au site depuis une URL
   * @param url {string}
   * @param cacheKey {string}
   * @param context {Context}
   */
  function fetchURL (url, cacheKey, context) {
    const options = {
      url,
      timeout: 5000,
      gzip: true
    }

    function sendRawHtml (body, contentType) {
      context.raw(body, {
        headers: {
          'Content-Type': contentType
        }
      })
    }

    const page = $cache.get(cacheKey)
    if (page && page.body) {
      return sendRawHtml(page.body, page.contentType)
    }

    request(options, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        console.log('error', error)
        return context.plain('Impossible de récupérer la page ' + url)
      }

      // on met ça en cache pendant 10min
      const page = {
        body: body,
        contentType: response.headers['content-type'] || 'text/html'
      }
      $cache.set(cacheKey, page, 600, logIfError)

      sendRawHtml(page.body, page.contentType)
    })
  }

  /**
   * Un proxy pour les pages externes en https
   * @route POST /public/httpsUrlProxy
   */
  controller.get('httpsUrlProxy/:url', function (context) {
    const url = context.arguments.url
    return fetchURL(url, `urlHttpsProxy${url}`, context)
  })
  /**
   * Un proxy pour les pages externes en http à partir d'un identifiant de ressource
   * @route GET /public/urlProxy/:oid
   */
  controller.get('urlProxy/:oid', function (context) {
    var oid = context.arguments.oid

    $ressourceRepository.load(oid, (error, ressource) => {
      if (error) {
        log.error(error)
        context.plain(error.toString())
      } else if (ressource && ressource.type === 'url') {
        const url = ressource && ressource.parametres && ressource.parametres.adresse
        if (url && url.substr(0, 7) === 'http://') {
          fetchURL(url, `urlProxy${oid}`, context)
        } else {
          const msg = 'La ressource ' + oid + ' n’a pas d’adresse en http://…'
          log.error(msg)
          context.plain(msg)
        }
      } else {
        context.plain('Il n’y a pas de ressource ' + oid + ' de type page externe')
      }
    })
  })
}
