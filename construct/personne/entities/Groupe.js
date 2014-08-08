"use strict";


function Groupe() {
  /**
   * Id
   * @type {Number}
   */
  this.id = '';
  /**
   * Nom
   * @type {string}
   */
  this.nom = '';
  /**
   * La liste des ids des personnes du groupe
   * @type {Array}
   */
  this.membres = []
}

var entity = lassi
    .Entity(Groupe)
    .addIndex('id', 'integer')
    .addIndex('nom', 'string')
    .addIndex('membres', 'integer')

module.exports = entity;
