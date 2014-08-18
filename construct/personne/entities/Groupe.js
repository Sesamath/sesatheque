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
  this.id = '';
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

/**
 * Stocke un groupe en cache et en base
 * @param {EntityInstance~StoreCallback} next
 */
Groupe.prototype.save = function (next) {
  var groupe = this
  log.dev('dans save groupe ' +groupe.nom)
  this.store(function(error, groupe) {
    log.dev('dans save groupe au retour du store ' +cacheKey)
    // on met en cache
    lassi.cache.set(lassi.personne.getCacheKeyGroupeByNom(groupe.nom), groupe, cacheTTL)
    lassi.cache.set('groupe_' +groupe.id, groupe, cacheTTL)
    next(error, groupe)
  })
}

var entity = lassi
    .Entity(Groupe)
    .on('beforeStore', function(next) {
      log.dev('beforeStore groupe ' +this.nom)
      next()
    })
    .on('afterStore', function(next) {
      log.dev('afterStore groupe ' +this.nom)
      next()
    })
    .addIndex('id', 'integer')
    .addIndex('nom', 'string')
    .addIndex('open', 'boolean')

module.exports = entity;
