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

module.exports = function (Archive) {
  /**
   * Idem Ressource avec errors en moins, et moins d'index
   * @constructor
   */
  Archive.construct = function () {
    /**
     * L'identifiant de la ressource, utilisé dans les urls
     * @type {Number}
     */
    this.id = 0
    /**
     * identifiant du dépôt d'origine (où est stockée et géré la ressource), reste null si créé ici
     * @type {String}
     */
    this.origine = null;
    /**
     * Id de la ressource dans son dépôt d'origine
     * @type {String}
     */
    this.idOrigine = null;
    /**
     * Le code du plugin qui gère la ressource
     * @type {String}
     */
    this.typeTechnique = '';
    /**
     * Titre
     * @type {String}
     */
    this.titre = '';
    /**
     * Résumé qui apparait souvent au survol du titre ou dans les descriptions brèves, destiné à tous
     * @type {String}
     */
    this.resume = '';
    /**
     *  Description plus complète, facultative (préférer le résumé)
     *  @type {String}
     */
    this.description = '';
    /**
     * Commentaires destinés aux éditeurs, ou au prescipteur de la ressource mais pas à l'utilisateur
     * @type {String}
     */
    this.commentaires = '';
    /**
     * Niveaux scolaire de la ressource, dans son système éducatif par défaut, fr_FR s'il n'est pas précisé
     * @type {Array}
     */
    this.niveaux = [];
    /**
     * Une catégorie correspond à un recoupement de types, par ex "exercice interactif"
     * @type {Array}
     */
    this.categories = [];
    /**
     * Type pédagogique (5.2 - scolomfr-voc-010) : cours, exercice...
     * C'est un champ conditionné par la catégorie, mais à priori seulement, l'utilisateur peut modifier / enrichir
     * http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=62
     * @type {Array}
     */
    this.typePedagogiques = [];
    /**
     * type documentaire (1.9 - scolomfr-voc-004) : image, ressource interactive, son, texte
     * Idem, conditionné par la catégorie mais à priori seulement
     * @see http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=49
     * @type {Array}
     */
    this.typeDocumentaires = [];
    /**
     * Liste des ressources liées, une liaison étant un array [idLiaison, idRessourceLiée]
     * @type {Array}
     */
    this.relations = [];
    /**
     * Contenu qui dépend du type technique (toutes les autres infos concernant la ressource de ce type)
     * @type {Object}
     */
    this.parametres = {};
    /**
     * Liste d'id d'auteurs
     * @type {Array}
     */
    this.auteurs = [];
    /**
     * Liste d'id de contributeurs
     * @type {Array}
     */
    this.contributeurs = [];
    /**
     * code langue ISO 639-2 (http://fr.wikipedia.org/wiki/Liste_des_codes_ISO_639-2)
     * @type {String}
     */
    this.langue = 'fra';
    /**
     * Vrai si la ressource est publiée (les non-publiées sont visibles par leur auteur et ceux ayant les droits ad hoc)
     * @type {boolean}
     */
    this.publie = false;
    /**
     * Restriction sur la ressource
     */
    this.restriction = 0;
    /**
     * Date de création
     * @type {Date}
     */
    this.dateCreation = new Date();
    /**
     * Date de mise à jour
     * @type {Date}
     */
    this.dateMiseAJour = undefined;
    /**
     * Version de la ressource
     */
    this.version = 0;
    /**
     * L'oid de l'archive correspondant à la version précédente
     */
    this.oidPrecedent = 0
  }

  Archive.beforeStore(function(next) {
    var archive = this
    // on regarde s'il y avait une archive précédente
    lassi.entity.Archive
    .match('id').equals(archive.id)
    .sort('version', 'desc')
    .grabOne(function(error, archivePrec) {
      if (archivePrec) archive.oidPrecedent = archivePrec.oid
        next()
    })
  })

  Archive
    .defineIndex('id', 'integer')
    .defineIndex('origine', 'string')
    .defineIndex('idOrigine', 'string')
    .defineIndex('version', 'integer')
}
