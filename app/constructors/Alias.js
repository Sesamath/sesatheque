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

/**
 * Définition d'un alias d'une ressource, qui sert à référencer sur une sésathèque une ressource
 * d'une autre sesatheque.
 * Il a les quasiment les même propriétés que Ref, avec
 * - oid en plus (c'est une entité, contrairement à Ref)
 * - jamais de propriétés enfants (si c'est un arbre il faudra aller chercher l'original pour avoir les enfants)
 * - baseId obligatoire
 * Le constructeur prend une Ressource ou un Alias
 *
 * Un item sera traité comme un alias s'il a à la fois oid et ref (et base, mais oid & ref suffisent, la base pouvant être ajoutée aux ressources)
 * @param {Object} [initObj={}] L'objet qui sert à initialiser un nouvel objet Alias
 * @constructor
 */
function Alias (initObj) {
  if (typeof initObj !== 'object') initObj = {}
  if (initObj.oid && initObj.ref && (initObj.baseId || initObj.base)) {
    // on nous passe un alias (on accepte d'affecter l'oid que si l'on a ref et baseId)
    /**
     * oid de l'alias
     * @type {number}
     */
    this.oid = initObj.oid
    /**
     * oid ou origine/idOrigine de la ressource que l'on référence
     * @type {number|string}
     */
    this.ref = initObj.ref
    // this base plus loin car peut exister sur un Alias sans oid (ex Ref)
  } else {
    // on nous passe un truc qu'on traite comme une ref ou une ressource
    this.ref = initObj.ref || initObj.oid
    if (!this.ref && initObj.origine && initObj.idOrigine) this.ref = initObj.origine + '/' + initObj.idOrigine
  }
  // cast en string
  if (this.ref && typeof this.ref !== 'string') this.ref += ''
  /**
   * Titre
   * @type {string}
   */
  this.titre = (initObj.titre && typeof initObj.titre === 'string') ? initObj.titre : 'Sans titre'
  if (initObj.resume && typeof initObj.resume === 'string') {
    /**
     * Résumé (pour l'élève)
     * @type {string}
     */
    this.resume = initObj.resume
  }
  if (initObj.commentaires && typeof initObj.commentaires === 'string') {
    /**
     * Commentaires (pour le formateur)
     * @type {string}
     */
    this.commentaires = initObj.commentaires
  }
  /**
   * Le type qui permet de savoir à quel type de contenu s'attendre, ou quel picto afficher
   * @type {string}
   */
  this.type = initObj.type
  /**
   * Un ou des id de catégorie(s) éventuel (pour un picto)
   * @type {Array}
   */
  this.categories = Array.isArray(initObj.categories) ? initObj.categories : []
  /**
   * True si public (sinon il faut être authentifié pour lire la ressource)
   * @type {boolean}
   */
  this.public = !!initObj.public || initObj.restriction === 0
  /**
   * Indique que la ressource est partagée (dans un groupe)
   * @property partage
   * @type {boolean}
   * @default undefined
   */
  if (this.groupes) this.partage = true
  else if (this.restriction === 2) this.partage = true

  /**
   * Clé de lecture
   * @type {string}
   */
  if (!this.public && initObj.cle) this.cle = initObj.cle
  /**
   * Nom de la sesatheque qui gère la référence ciblée
   * @type {string}
   */
  if (initObj.baseIdOriginal) this.baseIdOriginal = initObj.baseIdOriginal
  /**
   * L'oid du user qui créé l'alias (quand c'est un user qui copie une ressource
   * non éditable dans les siennes, il pourra éditer l'alias mais pas la ressource
   * dont il n'est pas auteur)
   * @type {Integer}
   */
  if (initObj.userOid) this.userOid = initObj.userOid
}

/**
 * Cast en string d'une ref (son titre)
 * @returns {string}
 */
Alias.prototype.toString = function () {
  return this.titre
}

module.exports = Alias
