"use strict";

var entityPersonne = lassi.Entity('Personne');

/**
 * Notre entité Personne
 * @constructor
 */
function Personne() {
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

entityPersonne
    .initialize(Personne)
    .index('nom')
    .index('email');

module.exports = entityPersonne;
