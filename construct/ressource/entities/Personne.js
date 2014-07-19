"use strict";

var entity = lassi.Entity('Personne');

entity.initialize = function() {
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
  this.email = '';
  /**
   * D'autres champs stockés en json, pour laisser la possibilité à des plugins d'ajouter facilement des infos,
   * suivant le source d'authentification par ex.
   * @type {string}
   */
  this.infos = '';
}

entity
    .addIndex('nom', 'string')
    .addIndex('email', 'string');

module.exports = entity;
