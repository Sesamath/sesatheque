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

module.exports = function (EntityRessource) {
  var merge = require('sesajstools/utils/object').merge
  var tools = require('../tools')
  var Ressource = require('../constructors/Ressource')
  var configRessource = require('./config')

  /**
   * Notre entité ressource, cf [Entity](lassi/Entity.html)
   * @entity EntityRessource
   * @param {Object} initObj Un objet ayant des propriétés d'une ressource
   * @extends Entity
   * @extends Ressource
   */
  EntityRessource.construct(function (initObj) {
    var entity = this
    // on récupère un objet Ressource correctement typé et initialisé
    var ressource = new Ressource(initObj)
    // que l'on merge à notre objet Entity
    merge(entity, ressource)

    // on cast les dates avec notre tools.toDate() qui gère mieux les fuseaux,
    // plus pratique ici que dans le constructeur qui ne peut faire de require
    if (initObj) {
      if (initObj.dateCreation && !(initObj.dateCreation instanceof Date)) initObj.dateCreation = tools.toDate(initObj.dateCreation)
      if (initObj.dateMiseAJour && !(initObj.dateMiseAJour instanceof Date)) initObj.dateMiseAJour = tools.toDate(initObj.dateMiseAJour)
    }

    // ajoute les éventuelles propriétés supplémentaire de notre objet initial
    // _.each(initObj, function (value, key) {
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

  // on laisse tomber beforeStore et afterStore ici car ils dépendent de cette entity, c'est le repository qui gère

  EntityRessource
    .defineIndex('cle', 'string')
    .defineIndex('origine', 'string')
    .defineIndex('idOrigine', 'string')
    .defineIndex('type', 'string')
    .defineIndex('titre', 'string')
    .defineIndex('niveaux', 'integer')
    .defineIndex('categories', 'integer')
    .defineIndex('typePedagogiques', 'integer')
    .defineIndex('typeDocumentaires', 'integer')
    // par défaut, la valeur de l'index est la valeur du champ, mais on peut fournir une callback qui la remplace
    // on retourne un tableau qui ne contient que les oid des éléments liés sans la nature de la relation
    // c'est une string car ça peut être 'alias/xxx' où xxx est l'oid de l'alias et pas l'oid d'une ressource
    // (pour gérer les relations avec des oid externes)
    .defineIndex('relations', 'string', function () {
      return this.relations.map(function (relation) {
        // on retourne pour chaque relation l'item lié
        return relation[1]
      })
    })
    // pour les arbres on veut avoir tous les enfants qu'ils contiennent (toutes générations comprises)
    .defineIndex('enfants', 'string', function () {
      var refsEnfants, enfant, i
      function addRefsEnfants (enfants) {
        for (i = 0; i < enfants.length; i++) {
          enfant = enfants[i]
          if (enfant.ref) refsEnfants.push(enfant.ref)
          else if (enfant.oid) refsEnfants.push(enfant.oid)
        }
      }
      if (this.enfants && this.enfants.length) {
        refsEnfants = []
        addRefsEnfants(this.enfants)
      }
      return refsEnfants
    })
    .defineIndex('auteurs', 'string')
    .defineIndex('contributeurs', 'integer')
    .defineIndex('groupes', 'string')
    .defineIndex('groupesAuteurs', 'string')
    .defineIndex('langue', 'string')
    .defineIndex('publie', 'boolean')
    .defineIndex('indexable', 'boolean')
    .defineIndex('restriction', 'integer')
    .defineIndex('dateCreation', 'date')
    .defineIndex('dateMiseAJour', 'date')

  EntityRessource.beforeStore(function (next) {
    if (this.token) delete this.token
    next()
  })
}
