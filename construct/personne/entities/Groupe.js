"use strict";

var cacheTTL = 3600

/**
 * Définition de l'entity Groupe
 * @constructor
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
 * Récupère un groupe d'après son nom
 * @param {string} groupeNom
 * @param {EntityInstance~StoreCallback} next
 */
Groupe.prototype.loadByNom = function (groupeNom, next) {
  var cacheKey = getCacheKeyByNom(groupeNom)
  var groupe = lassi.cache.get(cacheKey)
  if (groupe) return next(null, groupe)
  lassi.entity.Groupe.match('nom').equals(groupeNom).grabOne(function (error, groupe) {
    if (error) return next(error)
    if (groupe) {
      lassi.cache.set(cacheKey, groupe, cacheTTL)
      return next(null, groupe)
    }
    next(null, null)
  })
}

/**
 * Récupère un groupe d'après son id (si erreur on la log)
 * @param {int} id
 * @param {EntityInstance~StoreCallback} next
 */
Groupe.prototype.load = function (groupeId, next) {
  if (parseInt(groupeId, 10) !== groupeId) return next(new Error("Type mismatch, groupe.id doit être entier"))
  var cacheKey = 'groupe_' +groupeId
  var groupe = lassi.cache.get(cacheKey)
  if (groupe) return next(null, groupe)
  lassi.entity.Groupe.match('id').equals(groupeId).grabOne(function (error, groupe) {
    if (error) log.error(error)
    if (groupe) lassi.cache.set(cacheKey, groupe, cacheTTL)
    next(error, groupe)
  })
}

/**
 * Stocke un groupe en cache et en base
 * @param {EntityInstance~StoreCallback} next
 */
Groupe.prototype.save = function (next) {
  var cacheKey = 'groupe_' +this.id
  lassi.cache.set(cacheKey, this, cacheTTL)
  this.store(next)
}

var entity = lassi
    .Entity(Groupe)
    .addIndex('id', 'integer')
    .addIndex('nom', 'string')
    .addIndex('open', 'boolean')

module.exports = entity;

/**
 * Renvoie la clé de cache pour le stockage des groupes par leur nom
 * @param groupeNom
 * @returns {string} La clé
 */
function getCacheKeyByNom(groupeNom) {
  return 'groupeNom_' +groupeNom.replace(/[^\w]/, '')
}