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

"use strict"

module.exports = function (EntityAlias) {
  var config = require('../config')
  var Alias = require('./public/vendors/sesamath/Alias')
  var tools = require('../tools')

  /**
   * Notre entité Alias cf [Entity](lassi/Entity.html)
   * Utilisé uniquement par l'api externalClone, qui en crée pour les ressources non modifiables
   * et l'api liste/perso qui les récupère pour les filer à sesalab
   * @entity EntityAlias
   * @param {Object} initObj Un alias construit avant (Entity mergera après ce construct toutes les propriétés de initObj)
   * @extends Entity
   * @extends Alias
   */
  EntityAlias.construct(function (init) {
    tools.merge(this, new Alias(init))
  })

  EntityAlias.table = 'alias'

  EntityAlias
    .defineIndex('ref', 'string')
    .defineIndex('base', 'string')
    .defineIndex('proprio', 'integer')

  EntityAlias.beforeStore(function (next) {
    if (!this.proprio) {
      next(new Error("Impossible d'enregistrer un alias sans propriétaire"))
    } else if (!this.type) {
      next(new Error("Impossible d'enregistrer un alias sans type"))
    } else if (this.ref === this.oid && (!this.base || this.base === config.application.baseUrl)) {
      next(new Error("Cet alias se référence lui-même, impossible de l'enregistrer"))
    } else {
      // on sauvegarde toujours la base sans le slash de fin
      if (this.base && this.base.substr(-1) === '/') this.base = this.base.substr(0, this.base.length - 1)
      next()
    }
  })
}
