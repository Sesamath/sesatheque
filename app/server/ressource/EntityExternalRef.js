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

const {application: {baseId: myBaseId}, sesatheques} = require('../config')
const {exists, getBaseIdFromRid} = require('sesatheque-client/src/sesatheques')

module.exports = function entityExternalRefFactory (component) {
  component.entity('EntityExternalRef', function () {
    const EntityExternalRef = this

    /**
     * entity EntityExternalRef cf [Entity](lassi/Entity.html)
     * registry pour les sésathèques qui veulent être notifiées lors d'un changement sur une ressource
     * @entity EntityExternalRef
     * @extends Entity
     * @throws s'il manque baseId ou rid, ou si l'un des deux est incohérent (rid doit pointer sur une de nos ressources, baseId ne doit pas être la nôtre)
     */
    EntityExternalRef.construct(function (data) {
      if (!data || !data.baseId || !data.rid) throw Error('Il faut passer au moins baseId et rid pour créer une EntityExternalRef')
      const {baseId, rid} = data
      if (getBaseIdFromRid(rid) !== myBaseId) throw Error(`Cette EntityExternalRef ne doit pas être gérée ici (${myBaseId}, alors que rid vaut ${rid}`)
      if (!exists(baseId)) throw Error(`${baseId} inconnue`)
      if (!sesatheques.some(s => s.baseId === baseId)) throw Error(`${baseId} n’est pas déclaré en config, impossible de mettre un listener ici pour la prévenir en cas de modif de ${rid}  ${JSON.stringify(data)}`)
      /**
       * Oid de ce "listener", concaténation de baseId et rid (avec séparateur -), permet d'imposer l'unicité baseId/rid
       * en attendant que lassi gère des index unique combinés
       * @type {string}
       */
      this.oid = `${baseId}-${rid.replace('/', '-')}`

      /**
       * baseId de la sésathèque qui veut être prévenue lors d'une modif du rid ici
       * @type {string}
       */
      this.baseId = baseId

      /**
       * rid de la ressource à surveiller ici
       * (l'oid suffirait, mais on tient à ce que ceux qui nous causent passent le rid complet
       * pour vérifier qu'on est bien la sésathèque qu'ils croient, et faudra leur renvoyer
       * donc conserver le rid évite de déstructurer au stockage et restructurer à l'envoi de l'info)
       * @type {string}
       */
      this.rid = rid

      if (data.dateCreation) {
        this.dateCreation = typeof data.dateCreation === 'string' ? new Date(data.dateCreation) : data.dateCreation
      } else {
        this.dateCreation = new Date()
      }
    })

    EntityExternalRef.validateJsonSchema({
      type: 'object',
      properties: {
        oid: {type: 'string'},
        baseId: {type: 'string'},
        rid: {type: 'string'},
        dateCreation: {instanceof: 'Date'}
      },
      additionalProperties: false,
      required: ['oid', 'baseId', 'rid', 'dateCreation']
    })

    EntityExternalRef
      .defineIndex('baseId')
      .defineIndex('rid')
  })
}
