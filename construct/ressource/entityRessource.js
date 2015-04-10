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

/**
 * Entity Ressource
 * @param {Entity} Ressource L'entity fraichement crée par lassi.entity, que l'on va étoffer ici
 * @param $ressourceControl
 */
module.exports = function (Ressource, $ressourceControl) {

  var _ = require('lodash')
  var tools = require('../tools')
  var RessourceConstructor = require('./public/vendors/sesamath/Ressource')

  /**
   * Retourne le 1er id dispo à utiliser comme idOrigine pour l'origine "local"
   * Sera initialisé dans $ressourceRepository (une fois l'entité ressource construite)
   */
  Ressource.getFreeId = function () {}

  /**
   * L'entity Ressource
   * @param {Object} initObj Un objet ayant des propriétés d'une ressource
   * @constructor Ressource
   * @extends EntityInstance
   */
  Ressource.construct(function (initObj) {
    var entity = this
    // on cast d'abord les dates avec notre tools.toDate() qui gère mieux les fuseaux
    if (initObj) {
      if (initObj.dateCreation && !initObj.dateCreation instanceof Date) initObj.dateCreation = tools.toDate(initObj.dateCreation)
      if (initObj.dateMiseAJour && !initObj.dateMiseAJour instanceof Date) initObj.dateMiseAJour = tools.toDate(initObj.dateMiseAJour)
    }
    // on récupère un objet Ressource correctement typé et initialisé
    var ressource = new RessourceConstructor(initObj)
    // que l'on merge à notre Entity
    tools.merge(entity, ressource)
    // et on ajoute les éventuelles propriétés supplémentaire de notre objet initial
    _.each(initObj, function (value, key) {
      if (!entity.hasOwnProperty(key) && typeof value !== 'function') entity[key] = value
    })
  })


  Ressource.beforeStore(function (next) {
    // on ne met à jour cette date que si elle n'existait pas, sinon on veut garder la date de maj de la ressource
    // et pas de celle de son indexation ici
    if (!this.dateMiseAJour) {
      this.dateMiseAJour = new Date()
    }
    // cohérence de la restriction
    if (this.restriction === 2 && (!this.parametres.allow || !this.parametres.allow.groupes)) {
      log.error("Ressource " +this.oid +" restreinte à des groupes sans préciser lesquels, on la passe privée")
      this.restriction = 3
    }
    // si le tableau d'erreur est vide (devrait toujours être le cas,
    // on se réserve le droit de stocker des ressources imparfaites mais on plantera probablement ici ensuite)
    if (_.isEmpty(this.warnings)) delete this.warnings
    // et l'idOrigine pour une origine locale si la ressource n'en a pas encore un
    if (this.origine === 'local' && !this.idOrigine) this.idOrigine = Ressource.getFreeId()
    next()
  })

  // on peut pas mettre du $cacheRessource en afterStore car il est pas encore défini (il dépend de nous)

  Ressource
    .defineIndex('origine', 'string')
    .defineIndex('idOrigine', 'string')
    .defineIndex('typeTechnique', 'string')
    .defineIndex('niveaux', 'integer')
    .defineIndex('categorie', 'integer')
    .defineIndex('typePedagogiques', 'integer')
    .defineIndex('typeDocumentaires', 'integer')
    //.defineIndex('relations', 'integer') // chaque relation est un tableau, faudra voir si on peut indexer ça
    .defineIndex('auteurs', 'integer')
    .defineIndex('contributeurs', 'integer')
    .defineIndex('langue', 'string')
    .defineIndex('publie', 'boolean')
    .defineIndex('indexable', 'boolean')
    .defineIndex('restriction', 'integer')
    .defineIndex('dateCreation', 'date')
    .defineIndex('dateMiseAJour', 'date')
}
