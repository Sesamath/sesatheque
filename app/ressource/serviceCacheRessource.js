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

module.exports = function ($cache, $settings, EntityRessource) {
  var ttl = $settings.get('components.ressource.cacheTTL', 3600)

  function dummy () {}

  function getKey (id, origine) {
    var prefixRessource = 'ressource_'
    var prefixRessByOrigine = 'ressourceIdByOrigine_'
    return origine ? prefixRessByOrigine + origine + '_' + id : prefixRessource + id
  }

  /**
   * Service de gestion du cache des ressources (helper de $ressourceRepository)
   * @service $cacheRessource
   * @requires $cache
   * @requires $settings
   */
  var $cacheRessource = {}

  /**
   * Envoie une ressource du cache à next
   * @param {Number}         oid   Id de la ressource
   * @param {SimpleCallback} next Callback
   * @memberOf $cacheRessource
   */
  $cacheRessource.get = function (oid, next) {
    $cache.get(getKey(oid), function (error, ressourceCached) {
      var ressource
      if (!error) {
        if (ressourceCached) {
          ressource = EntityRessource.create(ressourceCached)
          // log.debug('ressource ' + oid + ' récupérée en cache')
        }
      }
      next(null, ressource)
    })
  }

  /**
   * Envoie une ressource du cache à next
   * @param {string}         aliasOf
   * @param {SimpleCallback} next
   * @memberOf $cacheRessource
   */
  $cacheRessource.getByAlias = function (aliasOf, next) {
    $cache.get(getKey(aliasOf, 'aliasOf'), function (error, oid) {
      if (error) return next(error)
      $cache.get(getKey(oid), function (error, ressourceCached) {
        if (error) log.error(error)
        if (ressourceCached) return next(null, EntityRessource.create(ressourceCached))
        next()
      })
    })
  }

  /**
   * Envoie une ressource du cache à next
   * @param {string}         cle
   * @param {SimpleCallback} next
   * @memberOf $cacheRessource
   */
  $cacheRessource.getByCle = function (cle, next) {
    $cache.get(getKey(cle, 'cle'), function (error, oid) {
      if (error) return next(error)
      $cache.get(getKey(oid), function (error, ressourceCached) {
        if (error) log.error(error)
        if (ressourceCached) return next(null, EntityRessource.create(ressourceCached))
        next()
      })
    })
  }

  /**
   * Envoie une ressource du cache à next
   * @param {string}         origine
   * @param {string}         idOrigine
   * @param {SimpleCallback} next
   * @memberOf $cacheRessource
   */
  $cacheRessource.getByOrigine = function (origine, idOrigine, next) {
    $cache.get(getKey(idOrigine, origine), function (error, oid) {
      if (error) {
        next(error)
      } else {
        $cache.get(getKey(oid), function (error, ressourceCached) {
          var ressource
          if (!error) {
            if (ressourceCached) {
              ressource = EntityRessource.create(ressourceCached)
              // log.debug('ressource ' + origine + '/' + idOrigine + ' récupérée en cache')
            }
          }
          next(null, ressource)
        })
      }
    })
  }

  /**
   * Met en cache une ressource
   * @param {EntityRessource}      ressource
   * @param {errorCallback} next
   * @memberOf $cacheRessource
   */
  $cacheRessource.set = function (ressource, next) {
    next = next || dummy
    log.debug('cache set ressource ' + ressource.oid, null, 'cache')
    if (ressource.oid) {
      // next appelé seulement sur le set principal (le dernier)
      if (ressource.origine && ressource.idOrigine) $cache.set(getKey(ressource.idOrigine, ressource.origine), ressource.oid, ttl)
      if (ressource.cle) $cache.set(getKey(ressource.cle, 'cle'), ressource.oid, ttl)
      if (ressource.aliasOf) $cache.set(getKey(ressource.aliasOf, 'aliasOf'), ressource.oid, ttl)
      $cache.set(getKey(ressource.oid), ressource, ttl, next)
    } else {
      log.error(new Error('cacheSet sur une ressource sans oid'))
    }
  }

  /**
   * Efface une ressource du cache
   * @param {Number}         oid
   * @param {SimpleCallback} next
   * @memberOf $cacheRessource
   */
  $cacheRessource.delete = function (oid, next) {
    next = next || dummy
    log.debug('delete cache ressource ' + oid, null, 'cache')
    // faut aller le chercher en cache pour effacer l'entrée par origine
    $cache.get(getKey(oid), function (error, ressource) {
      if (error) log.error(error)
      if (ressource) {
        $cache.delete(getKey(ressource.idOrigine, ressource.origine), error => { if (error) log.error(error) })
      }
      $cache.delete(getKey(oid), next)
    })
  }

  /**
   * Efface une ressource du cache d'après idOrigine
   * @param origine
   * @param idOrigine
   * @param next
   * @memberOf $cacheRessource
   */
  $cacheRessource.deleteByOrigine = function (origine, idOrigine, next) {
    log.debug('delete cache ressource ' + origine + '/' + idOrigine, null, 'cache')
    $cacheRessource.getByOrigine(origine, idOrigine, function (error, oid) {
      if (error) next(error)
      else if (oid) {
        $cache.delete(getKey(idOrigine, origine), dummy)
        $cacheRessource.delete(oid, next)
      } else next()
    })
  }

  // on ajoute une possibilité noCache en conf, on écrase seulement les getters pour qu'ils ne fassent rien
  if ($settings.get('noCache', false)) {
    log('$cacheRessource désactivé')
    $cacheRessource.get = function (oid, next) { next() }
    $cacheRessource.getByOrigine = function (origine, idOrigine, next) { next() }
  }

  return $cacheRessource
}
