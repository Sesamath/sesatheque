"use strict";

var _ = require('underscore')._

lassi.Entity('Personne', {
  /**
   * Constructeur utilisé par l'entity Personne
   * @constructor
   * @extends {EntityInstance}
   */
  construct: function () {
    this.id = 0
    /**
     * Prénom
     * @type {string}
     */
    this.prenom = '';
    /**
     * Nom
     * @type {string}
     */
    this.nom = '';
    /**
     * Adresse email
     * @type {string}
     */
    this.email = ''

    /**
     * La liste des permissions {permission:boolean} n'est pas une propriété stockée de l'entity mais définie par init
     * @type {Object}
     */

    /**
     * La liste des roles {role:boolean}
     * @type {Object}
     */
    this.roles = {}
    /**
     * La liste des groupes {groupe:boolean}
     * @type {Object}
     */
    this.groupes = {}
    /**
     * D'autres champs stockés en json, pour laisser la possibilité à des plugins d'ajouter facilement des infos,
     * suivant le source d'authentification par ex.
     * @type {string}
     */
    this.infos = '';
  },

  /**
   * Calcule et renvoie les permissions en fonction des rôles
   */
  getPermissions : function() {
    var permissions = {}
    var config = lassi.personne.settings;
    _.each(this.roles, function(hasRole, role) {
      // on ajoute les permissions définies pour ce role en config
      if (hasRole && config.roles[role]) lassi.tools.merge(permissions, config.roles[role])
    })
    return permissions
  },

  /**
   * Ajoute un groupe d'après son id (vérifie qu'il existe)
   * @param {int} groupeId
   * @param {EntityInstance~StoreCallback} next
   */
  addGroupeById: function (groupeId, next) {
    var personne = this
    if (!personne.groupes[groupeId]) {
      lassi.Groupe.load(groupeId, function (error, groupe) {
        if (groupe) {
          personne.groupes[groupeId] = true
        }
        next(null, personne)
      })
    }
  },

  /**
   * Ajoute un groupe à la personne (en le créant s'il n'existait pas)
   * @param {string} groupeNom Le nom
   * @param {EntityInstance~StoreCallback} next
   */
  addGroupeByName: function (groupeNom, next) {
    var personne = this
    lassi.personne.loadGroupeByNom(groupeNom, function (error, groupe) {
      if (error) {
        next(error, personne)
      } else if (groupe) {
        personne.groupes[groupe.id] = true
        next(null, personne)
      } else {
        // on le créé au passage
        lassi.entity.Groupe.create({nom:groupeNom}).store(function (error, groupe) {
          log.dev('après store ', groupe)
          if (groupe) personne.groupes[groupe.id] = true
          next(error, personne)
        })
        // @FIXME tant que le store marche pas on passe à la suite quand même
        next(null, personne)
      }
    })
  },
  configure: function() {
    this
      .defineIndex('id', 'integer')
      .defineIndex('nom', 'string')
      .defineIndex('email', 'string')
  }
});

