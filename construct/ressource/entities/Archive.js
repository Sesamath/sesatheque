"use strict";

var _ = require('underscore')._

/**
 * Idem Ressource avec errors en moins, et moins d'index
 * @constructor
 */
function Archive() {
  /**
   * L'oid de la ressource archivée
   */
  this.oidRessource = 0
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
  this.previousOid = 0
}

var entity = lassi.Entity(Archive)
  // finalement on laisse la gestion du cache dans les accesseurs du repository
  // plus pratique même si updateVersion appelle directement lassi.cache.ressource.XXX
  //.on('afterStore', function(next) {log.dev("afterStore", this); next();})
  .addIndex('id', 'integer')
  .addIndex('origine', 'string')
  .addIndex('idOrigine', 'string')
  .addIndex('version', 'integer')
  .addIndex('oidRessource', 'integer')

/* un écouteur sur registered qui pourrait servir
lassi.on('registered', function(className, path, ressource) {
  if (className === 'Ressource') log.dev(path +" registered")
}); /* */

module.exports = entity;


