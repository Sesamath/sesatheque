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
module.exports = function ressourceComponentFactory (lassi) {
  // Composant de gestion des ressources
  const ressourceComponent = lassi.component('ressource')

  require('./EntityExternalRef')(ressourceComponent)
  require('./EntityArchive')(ressourceComponent)
  require('./EntityRessource')(ressourceComponent)

  require('./serviceCacheRessource')(ressourceComponent)
  require('./serviceRessourceAutocomplete')(ressourceComponent)
  require('./serviceRessourceRemote')(ressourceComponent)
  require('./serviceRoutes')(ressourceComponent)
  require('./serviceRessourceRepository')(ressourceComponent)
  require('./serviceRessourceFetch')(ressourceComponent)
  require('./serviceRessourceControl')(ressourceComponent)

  require('./serviceRessourceConverter')(ressourceComponent)
  require('./serviceRessourcePage')(ressourceComponent)

  // les pages html de consultation / modification
  require('./controllerRessource')(ressourceComponent)
  // un controleur html pour des pages publiques sans session
  require('./controllerPublic')(ressourceComponent)
  // l'api json
  require('./controllerApi')(ressourceComponent)

  // import calculatice
  require('./controllerImportEc')(ressourceComponent)

  // En dev on ajoute des routes de debug
  if (!global.isProd) {
    require('./controllerDebug')(ressourceComponent)
  }

  // settings
  ressourceComponent.config(function ($settings) {
    // on vérifie que l'on a un cache avec des valeur acceptables
    var cacheTTL = $settings.get('components.ressource.cacheTTL', null)
    if (!cacheTTL) log.error('Pas de TTL pour le cache de ressource  (components.ressource.cacheTTL, en s), fixé à 1h')
    else if (cacheTTL < 60) throw new Error("Le cache ressource doit avoir un TTL d'au moins 60s")
    else if (cacheTTL > 24 * 3600) throw new Error('Le cache ressource doit avoir un TTL inférieur à 24h (86400s)')
  })
}
