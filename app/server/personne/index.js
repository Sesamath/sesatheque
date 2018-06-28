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

module.exports = function personneComponentFactory (lassi) {
  /**
   * Component de gestion des personnes (auteurs) et des groupes
   * On ne peut pas scinder en 2 composants car on aurait des dépendances cycliques
   * avec les services à cheval les deux entités
   * @private
   */
  const personneComponent = lassi.component('personne')

  personneComponent.config(function ($settings) {
    // on vérifie que l'on a un cache avec des valeur acceptables
    var cacheTTL = $settings.get('components.personne.cacheTTL', null)
    if (!cacheTTL) {
      log.error('Il faudrait indiquer un TTL pour le cache de personne' +
        ' (en s, dans components.personne.cacheTTL), on le fixe à 1h')
    }
    if (cacheTTL < 60) throw new Error("Le cache personne doit avoir un TTL d'au moins 60s")
    if (cacheTTL > 24 * 3600) throw new Error('Le cache personne doit avoir un TTL inférieur à 24h (86400s)')
  })

  require('./serviceCachePersonne')(personneComponent)

  require('./EntityPersonne')(personneComponent)

  require('./serviceCacheGroupe')(personneComponent)

  require('./EntityGroupe')(personneComponent)

  require('./serviceGroupeRepository')(personneComponent)
  require('./servicePersonneRepository')(personneComponent)
  require('./serviceAccessControl')(personneComponent)
  require('./servicePersonneControl')(personneComponent)

  // controleur des pages html de gestion de groupe
  require('./controllerGroupe')(personneComponent)
  // pour api/personne
  require('./controllerApiPersonne')(personneComponent)
  // pour api/groupe
  require('./controllerApiGroupe')(personneComponent)
}
