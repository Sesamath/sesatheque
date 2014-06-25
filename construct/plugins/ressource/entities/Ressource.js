"use strict";

var entity = lassi.Entity('Ressource')
  .initialize(function() {
    this.titre = '';
    this.resume = '';
    this.dateCreation = new Date();
    this.dateUpdate = null;
  })
  .index('dateCreation')
  .index('dateUpdate')
  .beforeStoring(function() {
    this.dateUpdate = new Date();
  });

module.exports = entity;
