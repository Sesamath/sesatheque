"use strict";

var cacheTTL = 3600

/**
 * Définition de l'entity Groupe
 * @constructor
 * @extends EntityInstance
 */
function Groupe() {
  /**
   * Id
   * @type {Number}
   */
  this.id = 0;
  /**
   * Nom
   * @type {string}
   */
  this.nom = '';
  /**
   * Visible dans la liste générale des groupes, tout le monde peut rentrer ou sortir à sa guise
   * @type {boolean}
   */
  this.open = false
}

var entity = lassi
    .Entity(Groupe)
    .on('beforeStore', function(next) {
      log.dev('beforeStore groupe ' +this.nom)
      next()
    })
    .on('afterStore', function(next) {
      // on met en cache
      lassi.tools.cache.set('groupe_' +this.id, this, cacheTTL)
      lassi.tools.cache.set('groupeNom_' +this.nom, this, cacheTTL)
      // et on passe au suivant sans se préoccuper du retour
      next()
    })
    .addIndex('id', 'integer')
    .addIndex('nom', 'string')
    .addIndex('open', 'boolean')

module.exports = entity;

