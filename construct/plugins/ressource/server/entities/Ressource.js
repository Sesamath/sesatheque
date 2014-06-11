"use strict";

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
  this.datecrea = init.datecrea || new Date();
  this.datemaj = init.datemaj || null;
}

Ressource.prototype.describe = function(models) {
  return {
    indexes: {
      datecrea: models.Types.Date,
      datemaj: models.Types.Date,
    },
    table: 'ress'
  }
}

Ressource.prototype.preSave = function(next) {
  // this.datemaj = (new Date()).getTime();
  this.datemaj = new Date();
  if (!this.oid && !this.datecrea) {
    this.datecrea = this.datemaj;
  }
  next();
}

module.exports = Ressource;
