"use strict";

var entityRessource = lassi.Entity('Ressource');

/**
 * Notre entité Ressource
 * @constructor
 */
function Ressource() {
  /**
   * Le code du plugin qui gère la ressource
   * @type {string}
   */
  this.codeTechnique = '';
  /**
   * Titre
   * @type {string}
   */
  this.titre = '';
  /**
   * Résumé qui apparait souvent au survol du titre ou dans les descriptions brèves, destiné à tous
   * @type {string}
   */
  this.resume = '';
  /**
   *  Description plus complète, facultative (préférer le résumé)
   *  @type {string}
   */
  this.description = '';
  /**
   * Commentaires destinés aux éditeurs, ou au prescipteur de la ressource mais pas à l'utilisateur
   * @type {string}
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
   * Contenu qui dépend du type technique, json
   * @type {Array}
   */
  this.contenu = '';
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
   * @type {string}
   */
  this.langue = 'fra';
  /**
   * Vrai si la ressource est publiée (les non-publiées sont visibles par leur auteur et ceux ayant les droits ad hoc)
   * @type {boolean}
   */
  this.publie = false;
  /**
   * Restriction sur la ressource :
   *   0 public
   *   1 restreint au rôle prof
   *   2 restreint en édition à l'auteur, visualisation à gérer suivant le contexte
   *   4 restreint au personnes ayant le rôle d'id 4 (à définir)
   *   ...
   * ces restrictions peuvent se combiner (masque binaire)
   */
  this.restriction = 1;
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
}

entityRessource
    .initialize(Ressource)
    .index('codeTechnique')
    .index('niveaux')
    .index('categories')
    .index('typePedagogiques')
    .index('typeDocumentaires')
    .index('relations')
    .index('auteurs')
    .index('contributeurs')
    .index('langue')
    .index('publie')
    .index('restriction')
    .index('dateCreation')
    .index('dateUpdate')
    .beforeStoring(function () {
      this.dateUpdate = new Date();
    });

module.exports = entityRessource;
