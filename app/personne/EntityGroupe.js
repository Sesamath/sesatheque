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

var Groupe = require('../constructors/Groupe')

module.exports = function (EntityGroupe, $cacheGroupe) {
  /**
   * L'entité groupe
   * @entity EntityGroupe
   * @extends Entity
   * @extends Groupe
   */
  EntityGroupe.construct(Groupe)

  EntityGroupe.table = 'groupe'

  EntityGroupe.beforeStore(function (next) {
    this.nom = this.nom.toLowerCase()
    if (!this.creationDate) this.creationDate = new Date()
    if (!this.gestionnaires || !this.gestionnaires.length) throw new Error('Impossible de sauvegarder un groupe sans gestionnaires')
    next()
  })

  EntityGroupe.afterStore(function (next) {
    // on met en cache
    $cacheGroupe.set(this, function (error) { if (error) log.error(error) })
    // et on passe au suivant sans se préoccuper du retour de mise en cache
    next()
  })

  EntityGroupe
    .defineIndex('nom', 'string')
    .defineIndex('pid', 'string')
    .defineIndex('ouvert', 'boolean')
    .defineIndex('public', 'boolean')
    .defineIndex('gestionnaires', 'string')
}
