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

'use strict';

/**
 * Component de gestion des types de contenu "personne".
 */
var personneComponent = lassi.component('personne')

//var _ = require('lodash')
//var tools = require('../tools')

personneComponent.config(function($settings) {
  // on vérifie que l'on a un cache avec des valeur acceptables
  var cacheTTL = $settings.get('components.personne.cacheTTL', null)
  if (!cacheTTL) log("Il faudrait indiquer un TTL pour le cache de personne" +
  " (en s, dans components.personne.cacheTTL), on le fixe à 1h")
  if (cacheTTL < 60) throw new Error("Le cache personne doit avoir un TTL d'au moins 60s")
  if (cacheTTL > 24*3600) throw new Error("Le cache personne doit avoir un TTL inférieur à 24h (86400s)")
})

personneComponent.service('$cachePersonne', function($cache, $settings) {
  return require('./serviceCachePersonne')($cache, $settings)
})


personneComponent.service('$cacheGroupe', function($cache, $settings) {
  return require('./serviceCacheGroupe')($cache, $settings)
})

personneComponent.entity('EntityGroupe', function ($cacheGroupe) {
  require('./EntityGroupe')(this, $cacheGroupe)
})

personneComponent.entity('EntityPersonne', function () {
  require('./EntityPersonne')(this)
})

personneComponent.service('$accessControl', function (EntityPersonne, EntityGroupe, $settings, $personneRepository) {
  return require('./serviceAccessControl')(EntityPersonne, EntityGroupe, $settings, $personneRepository)
})

personneComponent.service('$personneRepository', function(EntityPersonne, EntityGroupe, $cachePersonne, $cacheGroupe) {
  return require('./servicePersonneRepository')(EntityPersonne, EntityGroupe, $cachePersonne, $cacheGroupe)
})

personneComponent.service('$personneControl', function(EntityPersonne, EntityGroupe, $personneRepository, $accessControl) {
  return require('./servicePersonneControl')(EntityPersonne, EntityGroupe, $personneRepository, $accessControl)
})

// l'api json
personneComponent.controller('api/personne', function (EntityPersonne, $personneRepository, $accessControl) {
  require('./controllerApi')(this, EntityPersonne, $personneRepository, $accessControl)
})
