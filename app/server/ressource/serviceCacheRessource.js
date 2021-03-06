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

module.exports = function (component) {
  component.service('$cacheRessource', function ($cache, $settings, EntityRessource) {
    /**
     * Ne fait rien
     * @private
     */
    function dummy () {}

    /**
     * retourne la clé de cache (ressource_oid cache des ressources, ressourceBy_xxx des oid)
     * @private
     * @param {string} id oid ou clé
     * @param {string} [origine] origine (id est idOrigine) ou 'cle' (id est la clé), ignoré si id est un rid
     * @return {string}
     */
    function getKey (id, origine) {
      if (!id) {
        log.error(new Error('getKey veut un id'))
        return 'undefined'
      }
      if (origine) return `ressourceBy_${origine}_${id}`
      return `ressource_${id}`
    }

    const ttl = $settings.get('components.ressource.cacheTTL', 3600)

    if ($settings.get('noCache', false)) {
      return {
        get: dummy,
        getByCle: dummy,
        getByOrigine: dummy,
        set: dummy,
        delete: dummy,
        deleteByOrigine: dummy
      }
    }

    /**
     * Service de gestion du cache des ressources (helper de $ressourceRepository)
     * @service $cacheRessource
     * @requires $cache
     * @requires $settings
     */
    const $cacheRessource = {}

    /**
     * Envoie une ressource du cache (format Entity) à next
     * @param {Number}         oid   Id de la ressource
     * @param {RessourceCallback} next Callback
     * @memberOf $cacheRessource
     */
    $cacheRessource.get = function (oid, next) {
      $cache.get(getKey(oid), function (error, ressourceCached) {
        // on ne bloque pas si le cache est en erreur
        if (error) {
          log.error(error)
          return next()
        }
        if (ressourceCached) return next(null, EntityRessource.create(ressourceCached))
        next()
      })
    }

    /**
     * Envoie une ressource du cache (format Entity) à next
     * @param {string}         cle
     * @param {RessourceCallback} next
     * @memberOf $cacheRessource
     */
    $cacheRessource.getByCle = function (cle, next) {
      $cache.get(getKey(cle, 'cle'), function (error, oid) {
        if (error) {
          log.error(error)
          return next()
        }
        if (!oid) return next()
        $cache.get(getKey(oid), function (error, ressourceCached) {
          if (error) {
            log.error(error)
            return next()
          }
          if (ressourceCached) return next(null, EntityRessource.create(ressourceCached))
          next()
        })
      })
    }

    /**
     * Envoie une ressource du cache (format Entity) à next
     * @param {string}         origine
     * @param {string}         idOrigine
     * @param {RessourceCallback} next
     * @memberOf $cacheRessource
     */
    $cacheRessource.getByOrigine = function (origine, idOrigine, next) {
      $cache.get(getKey(idOrigine, origine), function (error, oid) {
        if (error) {
          log.error(error)
          return next()
        }
        if (!oid) return next()
        $cache.get(getKey(oid), function (error, ressourceCached) {
          if (error) {
            log.error(error)
            return next()
          }
          if (ressourceCached) return next(null, EntityRessource.create(ressourceCached))
          next()
        })
      })
    }

    /**
     * Met en cache une ressource
     * @param {EntityRessource}      ressource
     * @param {errorCallback} [next] en cas d'erreur du cache, elle sera logguée et next appelé avec la ressource reçue
     * @memberOf $cacheRessource
     */
    $cacheRessource.set = function (ressource, next = dummy) {
      if (!ressource.oid) return next(new Error('cacheSet sur une ressource sans oid'))
      // on utilise Entity.values(), pour stocker la même chose que ce qui aurait été mis en bdd
      if (typeof ressource.values !== 'function') return next(Error('$cache.set veut une Entity'))
      const values = ressource.values()
      const {oid, aliasOf, origine, idOrigine, cle} = values
      // next appelé seulement sur le set principal (le dernier)
      if (origine && idOrigine) $cache.set(getKey(idOrigine, origine), oid, ttl, log.ifError)
      if (cle) $cache.set(getKey(cle, 'cle'), oid, ttl, log.ifError)
      if (aliasOf) $cache.set(getKey(aliasOf, 'aliasOf'), oid, ttl, log.ifError)
      $cache.set(getKey(oid), values, ttl, function (error, ress) {
        if (error) {
          // on log mais on plante pas
          if (error.message && /^The length of the value is greater/.test(error.message)) {
            log.dataError(`ressource ${oid} trop grosse pour le cache (${error.message})`)
          } else {
            log.error(error)
          }
          return next(null, values)
        }
        next(null, ress)
      })
    }

    /**
     * Efface une ressource du cache
     * @param {Number}         oid
     * @param {SimpleCallback} [next]
     * @memberOf $cacheRessource
     */
    $cacheRessource.delete = function (oid, next = dummy) {
      // faut aller le chercher en cache pour effacer l'entrée par origine
      $cache.get(getKey(oid), function (error, ressource) {
        if (error) {
          log.error(error)
          return next()
        }
        if (ressource) {
          $cache.delete(getKey(ressource.idOrigine, ressource.origine), log.ifError)
          $cache.delete(getKey(oid), function (error) {
            if (error) log.error(error)
            next()
          })
        }
      })
    }

    /**
     * Efface une ressource du cache d'après idOrigine
     * @param {string} origine
     * @param {string} idOrigine
     * @param {errorCallback} [next]
     * @memberOf $cacheRessource
     */
    $cacheRessource.deleteByOrigine = function (origine, idOrigine, next = dummy) {
      $cacheRessource.getByOrigine(origine, idOrigine, function (error, oid) {
        if (error) {
          log.error(error)
          return next()
        }
        if (!oid) return next()
        $cache.delete(getKey(idOrigine, origine), log.ifError)
        $cache.delete(getKey(oid), function (error) {
          if (error) log.error(error)
          next()
        })
      })
    }

    return $cacheRessource
  })
}
