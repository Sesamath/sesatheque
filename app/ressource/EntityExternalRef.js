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

module.exports = function (EntityExternalRef) {
  const config = require('../config')
  const myBaseId = config.application.baseId
  const {exists, getBaseIdFromRid} = require('sesatheque-client/dist/sesatheques')

  /**
   * entity EntityExternalRef cf [Entity](lassi/Entity.html)
   * registry pour les sésathèques qui veulent être notifiées lors d'un changement sur une ressource
   * @entity EntityExternalRef
   * @extends Entity
   */
  EntityExternalRef.construct(function (data) {
    if (!data) data = {}
    /**
     * Oid de ce "listener"
     * @type {string}
     */
    this.oid = data.oid
    /**
     * baseId de la sésathèque qui veut être prévenue lors d'une modif
     * @type {string}
     */
    this.baseId = data.baseId
    /**
     * rid de la ressource à surveiller
     * @type {string}
     */
    this.rid = data.rid
  })

  // @todo inutile avec lassi#mongo, à virer après migration
  EntityExternalRef.table = 'externalRef'

  EntityExternalRef
    .defineIndex('baseId', 'string')
    .defineIndex('rid', 'string')

  EntityExternalRef.beforeStore(function (next) {
    try {
      // vérifications d'intégrité
      if (!this.baseId) throw new Error('EntityExternalRef sans baseId')
      if (!this.rid) throw new Error('EntityExternalRef sans rid')
      if (getBaseIdFromRid(this.rid) !== myBaseId) throw new Error(`Cette EntityExternalRef ne doit pas être gérée ici (${myBaseId}, alors que rid vaut ${this.rid}`)
      if (!exists(this.baseId)) throw new Error(`${this.baseId} inconnue`)
      if (!config.sesatheques.find(s => s.baseId === this.baseId)) throw new Error(`${this.baseId} n’est pas déclaré en config, impossible de mettre un listener ici pour la prévenir en cas de modif sur ${this.rid}`)
      // on a passé toutes les vérifs, sans oid on vérifie qu'on a pas déjà un listener
      // pour ce couple baseId / rid
      if (this.oid) return next()
      EntityExternalRef
        .match('baseId').equals(this.baseId)
        .match('rid').equals(this.rid)
        .grab(function (error, extRefs) {
          if (error) return next(error)
          if (extRefs.length === 0) return next()
          // y'en a au moins un, on garde le premier
          this.oid = extRefs[0].oid
          next()
          // on vire d'éventuels surnuméraires…
          if (extRefs.length > 1) {
            log.error(new Error(`ExternalRef en doublon (${extRefs.length}) pour ${this.rid} sur ${this.baseId}`))
            extRefs.slice(1).forEach(extRef => extRef.delete(log.error))
          }
        })
    } catch (error) {
      next(error)
    }
  })
}
