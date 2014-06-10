"use strict";

function Ressource(init) {
  this.titre = init.titre;
  this.resume = init.resume || '';
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
  this.datemaj = (new Date()).getTime();
  if (!this.oid && !this.datecrea) {
    this.datecrea = this.datemaj;
  }
  next();
}

module.exports = Ressource;
