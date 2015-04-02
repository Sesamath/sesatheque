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
 * @param Ressource L'entity fraichement crée par lassi.entity, que l'on va étoffer ici
 * @param $ressourceControl
 */
module.exports = function (Ressource, $ressourceControl) {

  var _ = require('lodash')
  var tools = require('../tools')

  // on regarde à la déclaration du service quel est le dernier idOrigine utilisé pour l'origine 'local'
  var firstFreeId
  Ressource.match('origine').equals('local').sort('idOrigine', 'desc').grabOne(function(error, entity) {
    if (error) throw error
    firstFreeId = 1
    if (entity) firstFreeId += entity.idOrigine
  })

  /**
   * Retourne le 1er id dispo à utiliser comme idOrigine pour l'origine "local"
   * @returns {number}
   */
  function getFreeId() {
    return firstFreeId++;
  }

  /**
   * L'entity Ressource
   * @param {Object} initObj Un objet ayant des propriétés d'une ressource
   * @constructor Ressource
   * @extends EntityInstance
   */
  Ressource.construct(function (initObj) {
    /**
     * Une liste d'avertissements éventuels (incohérences, données manquantes, etc.)
     * Pratique d'avoir un truc pour faire du push dedans sans vérifier qu'il existe
     * Viré au save s'il est vide
     */
    this.warnings = []
    /**
     * L'identifiant de la ressource, utilisé dans les urls
     * @type {Number}
     */
    this.id = 0
    /**
     * identifiant du dépôt d'origine (où est stockée et géré la ressource), reste null si créé ici
     * @type {String}
     */
    this.origine = 'local';
    /**
     * Id de la ressource dans son dépôt d'origine
     * @type {String}
     */
    this.idOrigine = 0;
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
     * @see "http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=62"
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
     * Vrai si la ressource est indexable (peut sortir sur des résultats de recherche)
     * Sert à distinguer des ressources "obsolètes" car remplacées par d'autres mais toujours publiées car utilisées.
     * @type {boolean}
     */
    this.indexable = false;
    /**
     * Restriction sur la ressource, cf lassi.settings.ressource.constantes.restriction
     */
    this.restriction = 0 // lassi.settings.ressource.constantes.restriction.aucune pas encore dispo
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
     * {integer}
     */
    this.version = 1;
    /**
     * L'oid de l'archive correspondant à la version précédente
     */
    this.archiveOid = 0

    // on ajoute toutes les propriétés de notre objet initial (avec des propriétés supplémentaires éventuelles)
    // Attention, oid aussi (faut le virer avant si c'est l'oid d'une autre entité, archive par ex)
    if (initObj) {
      var tmp = tools.clone(this)
      tools.merge(tmp, initObj)
      $ressourceControl.validate(tmp, function (error) {
        if (error) log.error(new Error("Objet invalide passé au constructeur Ressource,\n" +error.toString(), initObj))
        else tools.merge(this, initObj)
      })
    }

  })


  Ressource.beforeStore(function (next) {
    // on ne met à jour cette date que si elle n'existait pas, sinon on veut garder la date de maj de la ressource
    // et pas de celle de son indexation ici
    if (!this.dateMiseAJour) {
      this.dateMiseAJour = new Date()
    }
    // cohérence de la restriction
    if (this.restriction === 2 && (!this.parametres.allow || !this.parametres.allow.groupes)) {
      log.error("Ressource " +this.id +" restreinte à des groupes sans préciser lesquels, on la passe privée")
      this.restriction = 3
    }
    // si le tableau d'erreur est vide (devrait toujours être le cas,
    // on se réserve le droit de stocker des ressources imparfaites mais on plantera probablement ici ensuite)
    if (_.isEmpty(this.warnings)) delete this.warnings
    // et l'idOrigine pour une origine locale si la ressource n'en a pas encore un
    if (this.origine === 'local' && !this.idOrigine) this.idOrigine = getFreeId()
    next()
  })

  // on peut pas mettre du $cacheRessource en afterStore car il est pas encore défini (il dépend de nous)
  // on laisse un éventuel idOrigine à 0 avec une origine 'local', mais ce sera rectifié dès prochain load
  // donc on ne pourra jamais récupérer d'idOrigine nul

  Ressource
    .defineIndex('id', 'integer')
    .defineIndex('origine', 'string')
    .defineIndex('idOrigine', 'string')
    .defineIndex('typeTechnique', 'string')
    .defineIndex('niveaux', 'integer')
    .defineIndex('categories', 'integer')
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
