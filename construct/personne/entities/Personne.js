"use strict";


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
   * La liste des ids des roles
   * @type {Array}
   */
  this.roles = []
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
