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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

/**
 * Service de gestion du cache des ressources (helper de $ressourceRepository)
 * @module $cacheRessource
 * @requires $cache
 * @requires $settings
 */
module.exports = function ($cache, $settings, Ressource) {
  var ttl = $settings.get('components.ressource.cacheTTL', 3600)
  var prefixRessource = 'ressource_'
  var prefixRessByOrigine = 'ressourceIdByOrigine_'

  function dummy() {}

  return {
    /**
     * Envoie une ressource du cache à next
     * @param {Number}         id   Id de la ressource
     * @param {SimpleCallback} next Callback
     * @memberOf $cacheRessource
     */
    get: function (id, next) {
      $cache.get(prefixRessource +id, function (error, ressourceCached) {
        var ressource
        if (!error) {
          if (ressourceCached) ressource = Ressource.create(ressourceCached)
          log.debug('ressource ' + id + ' récupérée en cache', ressourceCached, 'cache')
          log.debug('devenue ', ressource, 'cache')
        }
        next(null, ressource)
      })
    },

    /**
     * Envoie une ressource du cache à next
     * @param {String}         origine
     * @param {String}         idOrigine
     * @param {SimpleCallback} next
     * @memberOf $cacheRessource
     */
    getByOrigine: function (origine, idOrigine, next) {
      $cache.get(prefixRessByOrigine +origine +'_' +idOrigine, function (error, id) {
        if (error) next(error)
        else $cache.get(prefixRessource +id, function (error, ressourceCached) {
          var ressource
          if (!error) {
            if (ressourceCached) ressource = Ressource.create(ressourceCached)
            log.debug('ressource ' +origine +'_' +idOrigine + ' récupérée en cache', ressourceCached, 'cache')
          }
          next(null, ressource)
        })
      })
    },

    /**
     * Met en cache une ressource
     * @param {Ressource}      ressource
     * @param {SimpleCallback} next
     * @memberOf $cacheRessource
     */
    set: function (ressource, next) {
      next = next || dummy
      log.debug("cache set ressource_" +ressource.id, null, 'cache')
      // next appelé seulement sur le set principal (le 2e)
      if (ressource.origine)
        $cache.set(prefixRessByOrigine +ressource.origine +'_' +ressource.idOrigine, ressource.id, ttl, dummy)
      $cache.set(prefixRessource + ressource.id, ressource, ttl, next)
    },

    /**
     * Efface une ressource du cache
     * @param {Number}         id
     * @param {SimpleCallback} next
     * @memberOf $cacheRessource
     */
    delete : function (id, next) {
      next = next || dummy
      // faut aller le chercher en cache pour effacer l'entrée par origine
      var msg = 'delete ressource ' +id
      $cache.get(prefixRessource +id, function (error, ressource) {
        if (ressource) {
          if (ressource.origine && ressource.idOrigine) {
            $cache.delete(prefixRessByOrigine + ressource.origine + '_' + ressource.idOrigine, dummy)
          }
          msg += " (trouvée)"
        } else {
          msg += " (pas trouvée)"
        }
        $cache.delete(prefixRessource + id, next)
        log.debug(msg, null, 'cache')
      })
    }
  }
}
