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

/**
 * Composant de gestion des ressources
 */
var ressourceComponent = lassi.component('ressource')

ressourceComponent.entity('EntityAlias', function () {
  require('./EntityAlias')(this)
})

ressourceComponent.entity('EntityArchive', function () {
  require('./EntityArchive')(this)
})

ressourceComponent.entity('EntityRessource', function () {
  require('./EntityRessource')(this)
})

ressourceComponent.service('$cacheRessource', function($cache, $settings, EntityRessource) {
  return require('./serviceCacheRessource')($cache, $settings, EntityRessource)
})

ressourceComponent.service('$routes', function($accessControl) {
  return require('./serviceRoutes')($accessControl)
})

ressourceComponent.service('$flashMessages', function() {
  return require('./serviceFlashMessages')()
})

ressourceComponent.service('$ressourceRepository', function(EntityRessource, EntityArchive, $ressourceControl, $cacheRessource, $cache, $routes) {
  return require('./serviceRessourceRepository')(EntityRessource, EntityArchive, $ressourceControl, $cacheRessource, $cache, $routes)
})

ressourceComponent.service('$ressourceControl', function(EntityRessource) {
  return require('./serviceRessourceControl')(EntityRessource)
})

ressourceComponent.service('$ressourceConverter', function (EntityRessource, $ressourceRepository, $routes, $settings) {
  return require('./serviceRessourceConverter')(EntityRessource, $ressourceRepository, $routes, $settings)
})

ressourceComponent.service('$views', function (EntityRessource, $ressourceRepository, $personneRepository, $ressourceConverter, $accessControl, $routes, $settings) {
  return require('./serviceViews')(EntityRessource, $ressourceRepository, $personneRepository, $ressourceConverter, $accessControl, $routes, $settings)
})

ressourceComponent.service('$json', function () {
  return require('./serviceJson')()
})

// nos ressources statiques
ressourceComponent.controller(function () {
  this.serve(__dirname + '/public')
})

// les pages html de consultation / modification
ressourceComponent.controller('ressource', function ($ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $views, $routes, EntityRessource) { // jshint ignore:line
  require('./controllerRessource')(this, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $views, $routes, EntityRessource)
})

// un controleur html pour des pages publiques sans session
ressourceComponent.controller('public', function ($ressourceRepository, $ressourceConverter, $views, $routes, $settings) {
  require('./controllerPublic')(this, $ressourceRepository, $ressourceConverter, $views, $routes, $settings)
})

// l'api json
ressourceComponent.controller('api', function (EntityAlias, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $json) {
  require('./controllerApi')(this, EntityAlias, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $json)
})

// import calculatice
ressourceComponent.controller('importEc', function ($ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $json, $personneControl, $views, $routes) { // jshint ignore:line
  require('./controllerImportEc')(this, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $json, $personneControl, $views, $routes)
})

// En dev on ajoute des routes de debug
if (!isProd) {
  ressourceComponent.controller('debug/ressource', function ($ressourceRepository, EntityRessource) {
    require('./controllerDebug')(this, $ressourceRepository, EntityRessource)
  })
}

// settings
ressourceComponent.config(function($settings) {
  // on vérifie que l'on a un cache avec des valeur acceptables
  var cacheTTL = $settings.get('components.ressource.cacheTTL', null)
  if (!cacheTTL) log("Pas de TTL pour le cache de ressource  (components.ressource.cacheTTL, en s), fixé à 1h")
  else if (cacheTTL < 60) throw new Error("Le cache ressource doit avoir un TTL d'au moins 60s")
  else if (cacheTTL > 24*3600) throw new Error("Le cache ressource doit avoir un TTL inférieur à 24h (86400s)")

  // on désactive la compression dust en dev
  if (!isProd && lassi.transports.html.engine.disableWhiteSpaceCompression) {
    lassi.transports.html.engine.disableWhiteSpaceCompression()
  }
})

// ajout de nos listeners
ressourceComponent.config(function($accessControl, $routes, $flashMessages) {
  var listeners = require('./listeners')($accessControl, $routes, $flashMessages)
  for (var eventName in listeners) {
    if (listeners.hasOwnProperty(eventName)) lassi.on(eventName, listeners[eventName])
  }
})
