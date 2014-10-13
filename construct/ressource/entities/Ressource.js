"use strict";

var _ = require('underscore')._

lassi.Entity('Ressource', {
  /**
   * L'entity Ressource
   * @constructor
   * @extends EntityInstance
   */
  construct: function () {
    /**
     * Une liste d'erreurs éventuelles (incohérences de données, etc)
     * Bien pratique d'avoir un truc pour faire du push dedans sans vérifier qu'il existe
     * Devrait être viré au save s'il est vide
     */
    this.errors = []
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
  },
  configure: function() {
    this
    .on('beforeStore', function(next) {
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
      if (_.isEmpty(this.errors)) delete this.errors
        // on ne peut pas générer l'id ici s'il n'existe pas car on a besoin de l'oid qui n'existe pas encore
        // idem pour updateVersion qui est géré dans le write (car on a besoin d'une callback)
        //log.dev('beforeStore fini')
        next()
    })
    .on('afterStore', function(next) {
      // on met en cache
      if (this.id) lassi.cache.set('ressource_' +this.id, this, lassi.ressource.cacheTTL)
        if (this.idOrigine) lassi.cache.set('ressourceIdByOrigine_' +
                                                  this.origine +'_' +this.idOrigine, this, lassi.ressource.cacheTTL)
          next()
    })
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
  },

  /**
   * Enregistre la ressource en archive, màj archiveOid sur la ressource courante et passe l'archive à next
   * (à l'appelant de gérer les versions)
   * @param next
   */
  archive: function (next) {
    if (!this.oid) {
      next(new Error("Impossible d'archiver une ressource qui n'existe pas encore"))
      return
    }
    var ressource = this
    var archive = ressource
    // on vire les propriétés dont on ne veut pas
    delete archive.oid
    if (this.archiveOid) archive.oidPrecedent = this.archiveOid
    if (archive.errors) {
      if (archive.errors.length) log.error("Archivage de la ressource " +this.oid +" (id " +this.id +
          ") qui comportait des erreurs : " +archive.errors.join('\n'))
      delete archive.errors
    }
    // et on archive
    lassi.entity.Archive.create(archive).store(function (error, archive) {
      if (error) next(error)
      else {
        ressource.archiveOid = archive.oid
        next(null, archive)
      }
    })
  },

  /**
   * Transforme la ressource en arbre (les parametres de la ressource où on ajoute titre et id)
   * @returns {Arbre|undefined} l'arbre (ou undefined si la ressource n'était pas de typeTechnique arbre)
   */
  toArbre: function () {
    if (this.typeTechnique !== 'arbre') return undefined
    var arbre = this.parametres
    // on ajoute id et titre
    arbre.id = this.id
    arbre.titre = this.titre
    return arbre
  }
});
