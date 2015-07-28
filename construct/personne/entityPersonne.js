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

module.exports = function (Personne) {
  /**
   * Retourne la liste des propriétés vraies d'un objet
   * @param obj
   * @returns {Array}
   */
  function truePropertiesList(obj) {
    var list = []
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop) && obj.prop) list.push(prop)
    }
    return list
  }

  Personne.construct(
    /**
     * @entity Personne(entity)
     * @constructor {Personne(entity)}
     * @param {Personne(object)} initObj Un objet ayant des propriétés d'une personne
     * @extends lassi#EntityInstance
     */
    function (initObj) {
      if (!initObj) initObj = {}
      /**
       * Source de l'authentification (nom du authClient)
       * @type {string}
       */
      this.origine = initObj.origine || null
      /**
       * Id de la source d'authentification
       * @type {string}
       */
      this.idOrigine = initObj.idOrigine || null
      /**
       * Prénom
       * @type {string}
       */
      this.prenom = initObj.prenom || ''
      /**
       * Nom
       * @type {string}
       */
      this.nom = initObj.nom || ''
      /**
       * Adresse email
       * @type {string}
       */
      this.email = initObj.email || ''
      /**
       * La liste des roles {role:boolean}
       * @type {Object}
       */
      this.roles = initObj.roles || {}
      /**
       * La liste des groupes {groupe:boolean}
       * @type {Object}
       */
      this.groupes = initObj.groupes || {}
      /**
       * D'autres champs stockés en json, pour laisser la possibilité à des plugins d'ajouter facilement des infos,
       * suivant le source d'authentification par ex.
       * @type {string}
       */
      this.infos = initObj.infos || ''

      /**
       * En session, on a une propriété "permissions" supplémentaire, ajouté au moment du login et de la mise en session,
       * elle est déduite des roles avec $accessControl.getPermissions(personne)
       */
    }
  )

  Personne
      .defineIndex('origine', 'string')
      .defineIndex('idOrigine', 'string')
      .defineIndex('nom', 'string')
      .defineIndex('email', 'string')
      // par défaut, la valeur de l'index est la valeur du champ, mais on peut fournir
      // une callback qui renvoie la valeur (ou un tableau de valeurs)
      .defineIndex('roles', 'string', function () {
        return truePropertiesList(this.roles)
      })
      .defineIndex('groupes', 'string', function () {
        return truePropertiesList(this.groupes)
      })
}
