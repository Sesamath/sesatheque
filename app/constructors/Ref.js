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

function filterString (value) {
  return typeof value === 'string' ? value : ''
}

/**
 * Définition d'une référence à une ressource, que l'on peut rencontrer dans les feuilles d'un arbre
 * Ce n'est pas une entité
 * @param {Object} [values={}] L'objet qui sert à initialiser un nouvel objet Ref, accepte une Ressource
 * @param {string} [baseId] Une base par défaut
 * @throws {Error} Si on passe des enfants sur un type non arbre
 * @constructor
 */
function Ref (values, baseId) {
  // @todo virer ref et baseId quand l'update 12 sera passé et que plus personne (j3p) ne les utilisera
  if (typeof values !== 'object') values = {}
  var ref = values.ref || values.oid || (values.origine && values.idOrigine && values.origine + '/' + values.idOrigine)
  if (ref) {
    /**
     * L'oid de la ressource que l'on référence, remplacé par aliasOf
     * @deprecated
     * @type {Integer|string}
     */
    this.ref = ref
  }
  if (values.baseId) {
    /**
     * L'id de la sesathèque concernée (présent maintenant dans aliasOf)
     * @deprecated
     * @type {string}
     */
    this.baseId = values.baseId
  }

  if (values.aliasOf) {
    /**
     * La ressource référencée (baseId/oid)
     * @type {string}
     */
    this.aliasOf = values.aliasOf
    if (values.rid) {
      // c'est une ressource avec son rid, alias d'une autre (aliasOf),
      // on note le rid de l'alias
      /**
       * Rid de la Ressource "alias" qui a servi à construire cette Ref
       * Utile pour le normalize de sesatheque-client qui construit les urls
       * (distinguer les urls d'affichage qui pointent vers l'original
       * et celles de modif qui pointent sur l'alias)
       * @type {string}
       */
      this.aliasRid = values.rid
    }
  } else if (values.rid) {
    this.aliasOf = values.rid
  } else if (ref) {
    if (values.baseId) this.aliasOf = values.baseId + '/' + ref
    else if (baseId) this.aliasOf = baseId + '/' + ref
    else throw new Error(`Impossible de convertir la ref ${ref} sans baseId`)
  }

  /**
   * Titre
   * @type {string}
   */
  this.titre = filterString(values.titre)
  /**
   * Résumé (pour tous)
   * @type {string}
   */
  this.resume = filterString(values.resume)
  /**
   * Description (pour tous)
   * @type {string}
   */
  this.description = filterString(values.description)
  /**
   * Commentaires (pour le formateur)
   * @type {string}
   */
  this.commentaires = filterString(values.commentaires)
  /**
   * Le type qui permet de savoir à quel type de contenu s'attendre, ou quel picto afficher
   * @type {string}
   */
  this.type = filterString(values.type)
  /**
   * Un ou des id de catégorie(s) éventuel (pour un picto)
   * @type {Array}
   */
  if (Array.isArray(values.categories)) this.categories = values.categories
  if (values.hasOwnProperty('public')) {
    /**
     * True si public (sinon il faut être authentifié pour lire la ressource)
     * @type {boolean}
     */
    this.public = Boolean(values.public)
  } else if (values.hasOwnProperty('restriction')) {
    this.public = !values.restriction && (!values.hasOwnProperty('publie') || Boolean(values.publie))
  } else {
    this.public = true
  }
  if (!this.public) {
    if (values.cle) {
      /**
       * Éventuelle clé de lecture, pour que des élèves puissent lire
       * la ressource non publique si leur prof la leur affecte
       * @type {string}
       */
      this.cle = values.cle
    }
    // pour le partage, on transmet si on nous l'indique, sinon on précise pas
    if (values.hasOwnProperty('partage')) {
      /**
       * true si la ressource privée est partagée avec un ou des groupes
       * @type {boolean}
       * @default undefined
       */
      this.partage = values.partage
    }
    if (values.groupes && values.groupes.length) this.partage = true
    else if (values.groupesAuteurs && values.groupesAuteurs.length) this.partage = true
  }
  if (values.enfants) {
    /**
     * Liste éventuelle d'enfants
     * @type {Ref[]}
     */
    this.enfants = values.enfants
  }
}

/**
 * Cast en string d'une ref (son titre)
 * @returns {string}
 */
Ref.prototype.toString = function () {
  return this.titre
}

module.exports = Ref
