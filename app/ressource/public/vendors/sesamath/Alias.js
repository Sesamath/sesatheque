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
"use strict";
(function () {
  // suivant que l'on est coté serveur ou client
  if (typeof define === 'function') {
    define('Alias', [], function () {
      return Alias;
    });
  } else if (typeof module === 'object') {
    module.exports = Alias;
  }
  // sinon on est chargé tel quel et ce que l'on défini ici se retrouve dans l'espace de nom global
  // pas trouvé comment documenté correctement un constructeur dans une fonction anonyme auto-exécutée…

  /* global define, module*/

  /**
   * Définition d'un alias d'une ressource, souvent d'une autre sesatheque
   * On prend en argument du constructeur une Ressource ou un Alias
   * Si on passe au constructeur un Alias avec oid mais sans ref il sera considéré comme une ref et va se référencer lui-même,
   * mais probablement sur une autre sesathèque, ce qui donnerait du grand n'importe quoi
   * et le store de l'entity va planter
   * @param {Object} [initObj={}] L'objet qui sert à initialiser un nouvel objet Alias
   * @constructor
   */
  function Alias(initObj) {
    if (!initObj instanceof Object) initObj = {};
    if (initObj.oid && initObj.ref && initObj.base) {
      // on nous passe un alias (on accepte d'affecter l'oid que si l'on a ref et base)
        // c'est un alias
        /**
         * oid de l'alias
         * @type {number}
         */
        this.oid = initObj.oid;
        /**
         * oid ou origine/idOrigine de la ressource que l'on référence
         * @type {number|string}
         */
        this.ref = initObj.ref;
        // this base plus loin car peut exister sur un Alias sans oid (ex Ref)
    } else {
      // on nous passe un truc qu'on traite comme une ref ou une ressource
      this.ref = initObj.ref || initObj.oid;
      if (!this.ref && initObj.origine && initObj.idOrigine) this.ref = initObj.origine + '/' + initObj.idOrigine;
    }
    /**
     * Clé de lecture
     * @type {string}
     */
    if (initObj.cle) this.cle = initObj.cle;
    /**
     * Titre
     * @type {string}
     */
    this.titre = (initObj.titre && typeof initObj.titre === 'string') ? initObj.titre : 'Sans titre';
    if (initObj.resume && typeof initObj.resume === 'string') {
      /**
       * Résumé (pour l'élève)
       * @type {string}
       */
      this.resume = initObj.resume;
    }
    if (initObj.commentaires && typeof initObj.commentaires === 'string') {
      /**
       * Commentaires (pour le formateur)
       * @type {string}
       */
      this.commentaires = initObj.commentaires;
    }
    /**
     * Le type qui permet de savoir à quel type de contenu s'attendre, ou quel picto afficher
     * @type {string}
     */
    this.type = initObj.type;
    /**
     * Un ou des id de catégorie(s) éventuel (pour un picto)
     * @type {Array}
     */
    this.categories = (initObj.categories && initObj.categories instanceof Array ) ? initObj.categories : [];
    /**
     * True si public (sinon il faut être authentifié pour lire la ressource)
     * @type {boolean}
     */
    this.public = (initObj.public || initObj.restriction === 0);
    /**
     * Base de la sesatheque qui gère la cible
     * @type {string}
     */
    this.base = initObj.base;
    if (initObj.userOid) {
      /**
       * L'oid du user qui créé l'alias (quand c'est un user qui copie une ressource non éditable dans les siennes)
       * @type {Integer}
       */
      this.userOid = initObj.userOid;
    }
  }

  /**
   * Cast en string d'une ref (son titre)
   * @returns {string}
   */
  Alias.prototype.toString = function () {
    return this.titre;
  };
})();
