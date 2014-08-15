"use strict";

/**
 * Constructeur utilisé par l'entity Personne
 * @constructor
 */
function Personne() {
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
   * La liste des permissions
   * @type {Object}
   */
  this.permissions = {}
  /**
   * D'autres champs stockés en json, pour laisser la possibilité à des plugins d'ajouter facilement des infos,
   * suivant le source d'authentification par ex.
   * @type {string}
   */
  this.infos = '';
}

var entity = lassi.Entity(Personne)
    .addIndex('id', 'integer')
    .addIndex('nom', 'string')
    .addIndex('email', 'string')

module.exports = entity;

Personne.prototype.addRolePermissions = function (role) {
  var personne = this
  var config = lassi.personne.settings;
  if (config.roles[role]) {
    config.roles[role].forEach(function (permission) {
      personne.addPermission(permission)
    })
  }
}

Personne.prototype.addPermission = function (permission) {
  if (!this.permissions[permission]) this.permissions[permission] = true
}