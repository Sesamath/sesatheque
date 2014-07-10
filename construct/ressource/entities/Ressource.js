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
  this.typeTechnique = '';
  /**
   * identifiant du dépôt d'origine (où est stockée et géré la ressource)
   * @type {string}
   */
  this.origine = null;
  /**
   * Id de la ressource (concaténation origine + id dans son dépôt d'origine, mep42 ou j3p42 par ex)
   * @type {string}
   */
  this.id = null;
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
}

entityRessource
    .initialize(Ressource)
    .index('id')
    .index('typeTechnique')
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
      // on ne met à jour cette date que si elle n'existait pas, sinon on veut garder la date de maj de la ressource
      // et pas de celle de son indexation ici
      if (!this.dateMiseAJour) {
        this.dateMiseAJour = new Date();
      }
      if (!this.version) {
        this.version = 1;
      }
      // on ne peut pas générer l'id ici s'il n'existe pas car on a besoin de l'oid qui n'existe pas encore
    });

module.exports = entityRessource;
