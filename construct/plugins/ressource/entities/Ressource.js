"use strict";

/**
 * Constructeur de l'objet Ressource, qui initialise les propriétés non fournies à leur valeurs par défaut
 * @param init
 * @constructor
 */
function Ressource(init) {
  /**
   * si on met pas ça le request.application.entity('Ressource').create({objet rempli}) déclenche
   * Cannot read property 'titre' of undefined
   */
  if (typeof init === 'undefined') {
    init = {};
  } /* */
  this.titre = init.titre || '';
  this.resume = init.resume || '';
  this.dateCreation = init.dateCreation || new Date();
  this.dateUpdate = init.dateUpdate || null;
  /* */
}

Ressource.prototype.describe = function(models) {
  return {
    indexes: {
      dateCreation: models.Types.Date,
      dateUpdate: models.Types.Date,
    },
    table: 'ressources'
  }
}

Ressource.prototype.preSave = function(next) {
  // this.datemaj = (new Date()).getTime();
  this.dateUpdate = new Date();
  if (!this.oid && !this.dateCreation) {
    this.dateCreation = this.dateUpdate;
  }
  next();
}

module.exports = Ressource;
