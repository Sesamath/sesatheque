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
/*global lassi*/

/** {Component} Composant de gestion des types de contenu "Ressource" */
var ressourceComponent = lassi.component('ressource')

ressourceComponent.config(function($settings) {
  // on vérifie que l'on a un cache avec des valeur acceptables
  var cacheTTL = $settings.get('components.ressource.cacheTTL', null)
  if (!cacheTTL) log("Pas de TTL pour le cache de ressource  (components.ressource.cacheTTL, en s), fixé à 1h")
  else if (cacheTTL < 60) throw new Error("Le cache ressource doit avoir un TTL d'au moins 60s")
  else if (cacheTTL > 24*3600) throw new Error("Le cache ressource doit avoir un TTL inférieur à 24h (86400s)")
})

ressourceComponent.entity('Ressource', function (Archive, $cacheRessource) {
  require('./Ressource')(this, Archive, $cacheRessource)
})

ressourceComponent.entity('Archive', function () {
  require('./Archive')(this)
})

/**
 * Service helper de $ressourceRepository
 */
ressourceComponent.service('$cacheRessource', function($cache, $settings) {
  var ttl = $settings.get('components.ressource.cacheTTL', 3600)

  return {
    get: function (id, next) {
      $cache.get('ressource_' +id, next)
    },
    getByOrigin: function (origine, idOrigine, next) {
      $cache.get('ressourceByOrigine_' +origine +'_' +idOrigine, function (error, id) {
        if (error) next(error)
        else $cache.get('ressource_' +id, next)
      })
    },
    set: function (ressource, next) {
      if (ressource.origine)
          $cache.set('ressourceByOrigine_' +ressource.origine +'_' +ressource.idOrigine, ressource.id, ttl)
      // next appelé seulement sur ce set principal
      $cache.set('ressource_' + ressource.id, ressource, ttl, next)
    },
    delete : function (id, next) {
      // faut aller le chercher en cache pour effacer par origine
      $cache.get('ressource_' +id, function (error, ressource) {
        if (ressource && ressource.origine && ressource.idOrigine)
            $cache.delete('ressourceByOrigine_' + ressource.origine + '_' + ressource.idOrigine)
      })
      $cache.delete('ressource_' +id, next)
    }
  }
})

ressourceComponent.service('$ressourceSettings', function ($settings) {
  return {
    /**
     * getter des settings de ressource (ajoute le préfixe components.ressource. avant d'appeler $settings.get)
     * @param key La clé (ex constantes.categories.activiteFixe)
     * @returns {*} La valeur de key dans les settings ou undefined
     */
    get: function (key) {
      return $settings.get('components.ressource.' +key, undefined)
    }
  }
})

ressourceComponent.service('$ressourceRepository', function(Ressource, $accessControl, $cacheRessource) {
  return require('./serviceRessourceRepository')(Ressource, $accessControl, $cacheRessource)
})

ressourceComponent.service('$ressourceConverter', require('./serviceRessourceConverter'))

// nos ressources statiques
ressourceComponent.controller(function () {
  this.serve(__dirname + '/public')
})

// les pages html de consultation / modification
ressourceComponent.controller('ressource', function ($ressourceRepository, $ressourceConverter, $accessControl) {
  log('def controller ressource')
  require('./controllerHtml')(this, $ressourceRepository, $ressourceConverter, $accessControl)
})

// un controleur html pour des pages publiques sans session
ressourceComponent.controller('public', function ($ressourceRepository, $ressourceConverter) {
  log('def controller public')
  require('./controllerPublic')(this, $ressourceRepository, $ressourceConverter)
})

// l'api json
ressourceComponent.controller('api', function ($ressourceRepository, $ressourceConverter, $accessControl) {
  log('def controller api')
  require('./controllerApi')(this, $ressourceRepository, $ressourceConverter, $accessControl)
})
/* */