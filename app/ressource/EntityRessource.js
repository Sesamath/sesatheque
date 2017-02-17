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
const tools = require('../tools')
const Ressource = require('../constructors/Ressource')
const sesatheques = require('sesatheque-client/src/sesatheques.js')
const config = require('../config')
// idem config.component.ressource, mais le require permet une meilleure autocompletion
const configRessource = require('./config')
const myBaseId = config.application.baseId

module.exports = function (EntityRessource) {
  /**
   * Notre entité ressource, cf [Entity](lassi/Entity.html)
   * @entity EntityRessource
   * @param {Object} values Un objet ayant des propriétés d'une ressource
   * @extends Entity
   * @extends Ressource
   */
  EntityRessource.construct(function (values) {
    // on initialise avec les propriétés d'un objet Ressource correctement typé et initialisé
    Object.assign(this, new Ressource(values, myBaseId))

    // mais après on ne peut plus ajouter de propriété dans afterStore, pas trouvé pourquoi…
    // => TypeError: Cannot assign to read only property 'rid' of object '#<Entity>'
    if (!this.rid) Object.defineProperty(this, 'rid', {writable: true, enumerable: true, configurable: false})

    // on cast les dates avec notre tools.toDate() qui gère mieux les fuseaux,
    // plus pratique ici que dans le constructeur qui ne peut faire de require
    if (values) {
      if (values.dateCreation && !(values.dateCreation instanceof Date)) values.dateCreation = tools.toDate(values.dateCreation)
      if (values.dateMiseAJour && !(values.dateMiseAJour instanceof Date)) values.dateMiseAJour = tools.toDate(values.dateMiseAJour)
    }

    // ajoute les éventuelles propriétés supplémentaire de notre objet initial
    // _.each(values, function (value, key) {
    //  if (!entity.hasOwnProperty(key) && typeof value !== 'function') log.debug('la propriété ' +key +' a été ignorée dans le constructeur de Ressource')
    // })

    // la langue par défaut
    if (this.langue) {
      // on rectifie fre en fra
      if (this.langue === 'fre') this.langue = 'fra'
    } else {
      this.langue = configRessource.langueDefaut
    }
  })

  // on veut pas d'une table entity_ressource
  EntityRessource.table = 'ressource'

  // on laisse tomber beforeStore ici car il dépend de cette entity, c'est le repository qui gère
  // afterStore est plus bas

  EntityRessource
    .defineIndex('rid', 'string')
    .defineIndex('baseId', 'string', function () {
      if (this.rid) return sesatheques.getBaseIdFromId(this.rid)
    })
    .defineIndex('cle', 'string')
    .defineIndex('origine', 'string')
    .defineIndex('idOrigine', 'string')
    .defineIndex('type', 'string')
    .defineIndex('titre', 'string')
    .defineIndex('niveaux', 'string')
    .defineIndex('categories', 'integer')
    .defineIndex('typePedagogiques', 'integer')
    .defineIndex('typeDocumentaires', 'integer')
    // par défaut, la valeur de l'index est la valeur du champ, mais on peut fournir une callback qui la remplace
    // on retourne un tableau qui ne contient que les oid des éléments liés sans la nature de la relation
    // c'est une string car ça peut être 'alias/xxx' où xxx est l'oid de l'alias et pas l'oid d'une ressource
    // (pour gérer les relations avec des oid externes)
    .defineIndex('relations', 'string', function () {
      // on retourne pour chaque relation l'item lié, tant pis pour la nature de la relation
      return this.relations.map(relation => relation[1])
    })
    // pour les arbres, on indexe tous les enfants, c'est lourd en écriture d'index
    // mais indispensable si on veut retrouver tous les arbres qui contiennent un item donné
    // (pour mettre à jour titre & résumé par ex).
    .defineIndex('enfants', 'string', function () {
      if (this.type !== 'arbre') return
      // on veut toutes les refs récursivement
      function addRidsEnfants (enfants) {
        enfants.forEach(enfant => {
          if (enfant.rid) {
            pushRid(enfant.rid)
          } else if (enfant.baseId) {
            if (enfant.oid) pushRid(enfant.baseId + '/' + enfant.oid)
            else if (enfant.ref) pushRid(enfant.baseId + '/' + enfant.ref)
          } else if (enfant.oid) {
            pushRid(myBaseId + '/' + enfant.oid)
          }
          if (enfant.enfants && enfant.enfants.length) addRidsEnfants(enfant.enfants)
        })
      }
      const pushRid = (rid) => {
        if (!alreadyAdded[rid]) {
          alreadyAdded[rid] = true
          ridsEnfants.push(rid)
        }
      }
      const ridsEnfants = []
      const alreadyAdded = {}
      if (this.enfants && this.enfants.length) addRidsEnfants(this.enfants)

      return ridsEnfants
    })
    .defineIndex('auteurs', 'string')
    .defineIndex('contributeurs', 'string')
    .defineIndex('groupes', 'string')
    .defineIndex('groupesAuteurs', 'string')
    .defineIndex('langue', 'string')
    .defineIndex('publie', 'boolean')
    .defineIndex('indexable', 'boolean')
    .defineIndex('restriction', 'integer')
    .defineIndex('dateCreation', 'date')
    .defineIndex('dateMiseAJour', 'date')

  // beforeStore est dans $ressourceRepository, historiquement,
  // pour des questions de cycle d'injection de dépendances

  // met en idOrigine l'oid de la ressource si origine locale et que ça n'y était pas encore
  // idem pour rid
  EntityRessource.afterStore(function (next) {
    let needToStore = false
    // on ajoute notre id en idOrigine si on est l'origine
    if (this.origine === myBaseId && !this.idOrigine) {
      this.idOrigine = this.oid
      needToStore = true
    }
    // on complète rid si besoin
    if (!this.rid) {
      this.rid = myBaseId + '/' + this.oid
      needToStore = true
    }
    if (needToStore) {
      this.store(next)
    } else {
      next()
    }
  })
}
