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

const flow = require('an-flow')
const {getNormalizedName} = require('../lib/normalize')

module.exports = function (component) {
  component.service('$cacheGroupe', function ($cache, $settings) {
    // on peut pas le mettre en dépendance car il nous utilise
    let EntityGroupe

    /**
     * TTL du cache des groupes, mis idem personne si c'est en conf, 20min par défaut
     * @type number
     */
    const ttl = $settings.get('components.personne.cacheTTL', 20 * 60)

    const prefix = 'groupe_'

    /**
     * Retourne la clé de cache d'un groupe, construite d'après son nom
     * (nom normalisé sans espace)
     * @private
     * @param {string|Groupe} groupe
     * @returns {string}
     */
    const getKey = (groupe) => {
      let key
      // si on tombait un jour sur une clé sortie de sanitizeHashKey qui plaisait pas à memcache,
      // utiliser un md5 du nom, mais c'est bcp plus gourmand
      // key = crypto.createHash('md5').update(data).digest('hex')
      // key = prefix + tools.sanitizeHashKey(nom)
      if (groupe) {
        let nom = typeof groupe === 'string' ? groupe : groupe.nom
        if (nom) {
          nom = getNormalizedName(nom).replace(' ', '')
          if (nom) return nom
        }
      }
      return key
    }

    /**
     * Enrobe next pour passer le groupe retourné du cache par EntityGroupe.create
     * @private
     * @param {groupeCallback} next
     * @return {groupeCallback}
     */
    const getWrapper = (next) => {
      if (!EntityGroupe) EntityGroupe = lassi.service('EntityGroupe')
      return (error, groupe) => {
        if (error) return next(error)
        if (!groupe) return next()
        next(null, EntityGroupe.create(groupe))
      }
    }

    /**
     * Récupère un groupe dans le cache, d'après son oid
     * @param {string} oid
     * @param {groupeCallback} next
     * @memberOf $cacheGroupe
     */
    function get (oid, next) {
      $cache.get(prefix + oid, getWrapper(next))
    }

    /**
     * Récupère un groupe dans le cache, d'après son nom
     * @param {string} nom Le nom, normalisé ou pas
     * @param {groupeCallback} next
     * @memberOf $cacheGroupe
     */
    function getByNom (nom, next) {
      const key = getKey(nom)
      if (!key) return next(Error('Nom manquant'))
      $cache.get(key, getWrapper(next))
    }

    /**
     * Met un groupe en cache
     * @param {Groupe} groupe
     * @param {errorCallback} [next]
     * @memberOf $cacheGroupe
     */
    function set (groupe, next = log.ifError) {
      const key = getKey(groupe)
      if (key) {
        flow().seq(function () {
          $cache.set(key, groupe, ttl, this)
          if (groupe.oid) $cache.set(prefix + groupe.oid, groupe, ttl, log.ifError)
        }).seq(function () {
          if (next) next()
        }).catch(function (error) {
          log.error(`le $cache.set a planté avec la clé ${key}`, error)
          // pb de clé, tant pis, ça sera pas en cache via le nom
          // (pas de risque d'avoir une ancienne version foireuse au get)
          if (next) next()
        })
      } else {
        const error = Error('Groupe invalide')
        if (next) next(error)
        else log.error(error, groupe)
      }
    }

    /**
     * Efface un groupe du cache
     * @param {string|Groupe} groupe (l'objet ou son nom)
     * @param {errorCallback} [next]
     * @memberOf $cacheGroupe
     */
    function deleteGroupe (groupe, next = log.ifError) {
      const key = getKey(groupe)
      if (key) {
        if (groupe.oid) {
          $cache.delete(key, next)
          $cache.delete(prefix + groupe.oid, next)
        } else {
          // faut aller le chercher en cache pour récupérer l'oid
          $cache.get(key, (error, groupe) => {
            if (error) return next(error)
            if (!groupe) return next()
            $cache.delete(key, next)
            $cache.delete(prefix + groupe.oid, next)
          })
        }
      } else {
        next(new Error('groupe invalide'))
      }
    }

    // on ajoute une possibilité noCache en conf
    if ($settings.get('noCache', false)) {
      log('$cacheRessource désactivé')
      const dummy = (arg, next) => next()
      return {
        delete: dummy,
        get: dummy,
        getByNom: dummy,
        set: dummy
      }
    }

    /**
     * Service helper de $personneRepository
     * Chaque groupe est mis en cache deux fois, par son nom et son oid
     * @service $cacheGroupe
     */
    const $cacheGroupe = {
      delete: deleteGroupe,
      get,
      getByNom,
      set
    }

    return $cacheGroupe
  })
}
